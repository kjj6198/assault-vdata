"""Reproducibly normalize MOHW tables. Fail on unexpected cells or broken totals.
Published cross-table differences remain explicit quality notes, never corrections.
"""
import hashlib, json, pathlib, re
import openpyxl
from odf.opendocument import load
from odf.table import Table, TableRow
from odf.teletype import extractText
ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCES = json.loads((ROOT / 'data/sources.json').read_text())
AGES = ['0–未滿6歲', '6–未滿12歲', '12–未滿18歲', '18–未滿24歲', '24–未滿30歲', '30–未滿40歲', '40–未滿50歲', '50–未滿65歲', '65歲以上', '不詳']
AGE_COLS = [3,4,5,7,8,9,10,11,12,14]
records, totals, notes, checks = [], [], [], 0

def check(condition, message):
    global checks
    checks += 1
    if not condition: raise ValueError(message)

def number(value):
    check(value is not None and value != '', f'Missing numeric cell: {value!r}')
    n = float(value)
    check(n >= 0 and n.is_integer(), f'Invalid count: {value!r}')
    return int(n)

def rows(source):
    path = ROOT / 'data/raw' / source['file']
    check(hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256'], f'Hash mismatch: {path}')
    if path.suffix == '.xlsx':
        sheet = openpyxl.load_workbook(path, data_only=True).worksheets[0]
        return sheet.title, list(sheet.values)
    table = load(path).spreadsheet.getElementsByType(Table)[0]
    result = []
    for row in table.getElementsByType(TableRow):
        values = []
        for c in row.childNodes:
            if c.qname[1] not in ('table-cell', 'covered-table-cell'): continue
            value = c.getAttribute('value') or extractText(c)
            values.extend([value] * min(int(c.getAttribute('numbercolumnsrepeated') or 1), 40))
        result.append(values)
    return table.getAttribute('name'), result

def record(source, sheet, row, col, year, value, **dimensions):
    records.append(dict(dataset=source['dataset'], year=year, value=number(value), **dimensions,
                        source=source['file'], sheet=sheet, row=row, column=col))

def total(source, year, value):
    totals.append(dict(dataset=source['dataset'],year=year,value=number(value),source=source['file']))

for source in SOURCES:
    kind = source['dataset']
    # The 2019-only attachment duplicates the later consolidated 2019–2020 release.
    if source['file'] == 'relationships-2019.ods': continue
    if kind == 'suspects':
        path = ROOT / 'data/raw' / source['file']
        check(hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256'], f'Hash mismatch: {path}')
        workbook = openpyxl.load_workbook(path, data_only=True)
        for title in ['2015~2018', '2019~2020', '歷年(2021~)']:
            ws = workbook[title]
            columns = [c.column for c in ws[4] if '性侵害嫌疑人年齡統計' in str(c.value)]
            check(len(columns) == 1, f'Expected one suspect total column: {title}')
            col = columns[0]
            check(ws.cell(6, col).value == '合計', f'Expected suspect total: {title}')
            year = None
            for row in ws.iter_rows(min_row=8):
                if row[0].value is not None:
                    # Exclude quarters and half-years, which duplicate the annual observations.
                    match = re.fullmatch(r'\d{3}年\s*(20\d{2})', str(row[0].value))
                    year = int(match[1]) if match else None
                if year is None: continue
                label = row[2].value
                if label == '計 Total':
                    total(source, year, row[col-1].value)
                    continue
                genders = {'男 Male': '男', '女 Female': '女', '其他 Other': '其他', '不詳Unknown': '不詳'}
                check(label in genders, f'Unexpected suspect gender: {title} {row[0].row} {label}')
                record(source, title, row[0].row, col, year, row[col-1].value, gender=genders[label])
        check(sorted(t['year'] for t in totals if t['dataset'] == kind) == list(range(2015, 2026)), 'Suspect year coverage')
        continue
    sheet, table = rows(source)
    year = None
    if kind in ['victims', 'reports']:
        cities = table[3][2:24]
        check(len(set(cities)) == 22, 'Expected 22 unique cities')
        for i,r in enumerate(table):
            if not re.fullmatch(r'20\d\d年', str(r[0])): continue
            year = int(str(r[0])[:4])
            for c,city in enumerate(cities,2):
                record(source,sheet,i+1,c+1,year,r[c],city=city)
            check(sum(number(v) for v in r[2:24]) == number(r[24]), f'{kind} city sum {year}')
            total(source,year,r[24])
    elif kind == 'demographics':
        for i,r in enumerate(table):
            if re.fullmatch(r'20\d\d年',str(r[0])): year=int(str(r[0])[:4])
            if year is None or r[1] not in ['男','女','其他','不詳','總計']: continue
            check(sum(number(r[c]) for c in AGE_COLS) == number(r[15]), f'Age sum {year} {r[1]}')
            check(sum(number(r[c]) for c in [3,4,5]) == number(r[6]), f'Minor subtotal {year}')
            check(sum(number(r[c]) for c in [7,8,9,10,11,12]) == number(r[13]), f'Adult subtotal {year}')
            if r[1] == '總計':
                total(source,year,r[15]); continue
            for c,age in zip(AGE_COLS,AGES):
                record(source,sheet,i+1,c+1,year,r[c],age=age,gender=r[1])
    else:
        old = '2008-2018' in source['file']
        total_col = table[3].index('總計')
        labels=[]
        parent=''
        for c in range(3,total_col):
            if old: label=table[3][c]
            elif table[3][c] == '不詳': label='不詳'
            else:
                if table[4][c]: parent=table[4][c]
                label=parent + ('／'+table[5][c] if table[5][c] else '')
            check(bool(label), 'Missing relationship label')
            labels.append(label)
        check(len(labels)==len(set(labels)), 'Duplicate relationship headers')
        for i,r in enumerate(table):
            if re.fullmatch(r'20\d\d年',str(r[0])): year=int(str(r[0])[:4])
            if year is None or r[1] not in ['總計','不詳'] and '~' not in str(r[1]) and '65歲以上' != r[1]: continue
            active = [(c, label, number(r[c])) for c,label in enumerate(labels,3) if r[c] != ""]
            values = [v for _,_,v in active]
            if sum(values) != number(r[total_col]):
                notes.append(dict(kind='published-row-total-difference', year=year, age=str(r[1]), source=source['file'], row=i+1, published=number(r[total_col]), computed=sum(values)))
            if r[1] == '總計':
                total(source,year,r[total_col])
                for c,label,v in active:
                    actual=sum(x['value'] for x in records if x['dataset']==kind and x['year']==year and x['relationship']==label)
                    if actual != v:
                        notes.append(dict(kind='published-column-total-difference', year=year, relationship=label, source=source['file'], column=c+1, published=v, computed=actual))
                continue
            age = str(r[1]).replace('~','–未滿').replace('歲未滿','歲')
            check(age in AGES,f'Unknown age {age}')
            for c,label,v in active:
                record(source,sheet,i+1,c+1,year,v,age=age,relationship=label)

keys=[(r['dataset'],r['year'],r.get('city'),r.get('age'),r.get('gender'),r.get('relationship')) for r in records]
check(len(keys)==len(set(keys)),'Duplicate records')
years=sorted(set(r['year'] for r in records))
for year in years:
    annual={t['dataset']:t['value'] for t in totals if t['year']==year}
    check(len(annual)==(5 if year >= 2015 else 4),f'Incomplete source coverage: {year}')
    check(annual['victims']==annual['demographics']==annual['relationships'],f'National totals differ: {year}')
    for kind, expected in annual.items():
        check(sum(r['value'] for r in records if r['year']==year and r['dataset']==kind)==expected, f'Total {kind} {year}')
    for age in AGES:
        values={kind:sum(r['value'] for r in records if r['dataset']==kind and r['year']==year and r.get('age')==age) for kind in ['demographics','relationships']}
        if len(set(values.values()))>1:
            notes.append(dict(year=year,age=age,kind='published-age-difference',**values))

records.sort(key=lambda r:(r['dataset'],r['year'],r.get('city',''),r.get('age',''),r.get('gender',''),r.get('relationship','')))
result=dict(schemaVersion=1,years=years,ages=AGES,sources=SOURCES,totals=totals,records=records,qualityNotes=notes)
(ROOT/'data/clean.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
(ROOT/'data/validation.json').write_text(json.dumps(dict(checks=checks,records=len(records),years=years,qualityNotes=notes),ensure_ascii=False,indent=2)+'\n')
print(f'{len(records)} records, {checks} checks passed, {len(notes)} published differences preserved. Years {years[0]}–{years[-1]}.')
