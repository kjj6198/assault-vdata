"""Fetch and normalize RIS year-end populations to the statistics' 22-county geography."""
import hashlib, json, pathlib, re, subprocess, sys, zipfile
import xml.etree.ElementTree as ET
ROOT = pathlib.Path(__file__).resolve().parents[1]
DIR = ROOT / 'data/population'
URL = 'https://www.ris.gov.tw/info-popudata/app/awFastDownload/view?type=ods&m4c=y0s1&d5c='
PAGE = 'https://www.ris.gov.tw/info-popudata/app/awFastDownload/toMain_panel'
FILE = DIR / 'counties-age-sex.ods'
if '--fetch' in sys.argv:
    subprocess.run(['curl', '-fLsS', '--retry', '3', '--max-time', '60', URL, '-o', str(FILE)], check=True)
T = '{urn:oasis:names:tc:opendocument:xmlns:table:1.0}'
root = ET.fromstring(zipfile.ZipFile(FILE).read('content.xml'))
names = {c['name'] for c in json.loads((ROOT / 'data/geo/map-paths.json').read_text())['counties']}
aliases = {'臺北縣':'新北市', '桃園縣':'桃園市', '臺中縣':'臺中市', '臺南縣':'臺南市', '高雄縣':'高雄市'}
records, totals = [], []
for table in root.iter(T+'table'):
    sheet = table.get(T+'name')
    if not sheet.isdigit() or not 97 <= int(sheet) <= 114: continue
    year = int(sheet) + 1911
    rows = []
    for row in table.findall(T+'table-row'):
        cells = []
        for cell in row:
            cells.extend([''.join(cell.itertext()).strip()] * min(4, int(cell.get(T+'number-columns-repeated', 1))))
            if len(cells) >= 3: break
        rows.append(cells[:3])
    county = {}
    national = None
    for i, row in enumerate(rows):
        if len(row) < 3 or row[1] != '計': continue
        label = row[0] or rows[i+1][0]
        label = re.sub(r'\s', '', label).replace('台', '臺')
        value = int(row[2].replace(',', ''))
        assert value > 0
        # Every published total must equal its male and female rows.
        assert value == sum(int(rows[i+j][2].replace(',', '')) for j in [1, 2])
        if label == '總計': national = value
        city = aliases.get(label, label)
        if city not in names: continue
        entry = county.setdefault(city, {'year':year, 'city':city, 'population':0, 'cells':[]})
        entry['population'] += value
        entry['cells'].append({'sheet':sheet, 'row':i+1, 'column':3, 'area':label, 'value':value})
    assert set(county) == names, (year, set(county) ^ names)
    assert sum(c['population'] for c in county.values()) == national, year
    records.extend(county.values())
    totals.append({'year':year, 'population':national})
assert len(records) == 18 * 22
source = {'provider':'內政部戶政司', 'title':'縣市人口數按性別及五歲年齡組分', 'page':PAGE, 'url':URL, 'file':FILE.name, 'sha256':hashlib.sha256(FILE.read_bytes()).hexdigest(), 'basis':'當年年底戶籍人口', 'geography':'合併改制前臺中、臺南、高雄縣市；臺北縣改稱新北市、桃園縣改稱桃園市。'}
result = {'source':source, 'records':sorted(records, key=lambda r:(r['year'],r['city'])), 'totals':sorted(totals, key=lambda r:r['year'])}
(DIR / 'clean.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print(f'Validated {len(records)} county-year populations; all 18 national totals reconcile.')
