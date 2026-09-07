"""Independent cell-level verification using only the Python standard library.
Reads the XML inside XLSX/ODS directly, independently of the extraction libraries.
"""
import hashlib, json, pathlib, re, xml.etree.ElementTree as ET, zipfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
database = json.loads((ROOT/'data/clean.json').read_text())
ODS = {'t': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0', 'o': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0'}
XLSX = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
cells = {}
for source in database['sources']:
    path=ROOT/'data/raw'/source['file']
    assert hashlib.sha256(path.read_bytes()).hexdigest()==source['sha256'],path
    values={}
    with zipfile.ZipFile(path) as archive:
        if path.suffix=='.xlsx':
            root=ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
            for c in root.findall('.//s:c',XLSX):
                v=c.find('s:v',XLSX)
                if v is None or c.attrib.get('t') in ['s','str']: continue
                match=re.fullmatch(r'([A-Z]+)(\d+)',c.attrib['r'])
                col=0
                for char in match[1]: col=col*26+ord(char)-64
                values[(int(match[2]),col)]=float(v.text)
        else:
            root=ET.fromstring(archive.read('content.xml'))
            table=root.find('.//t:table',ODS)
            for row_number,row in enumerate(table.findall('t:table-row',ODS),1):
                col=1
                for c in row:
                    repeated=int(c.attrib.get('{'+ODS['t']+'}number-columns-repeated',1))
                    v=c.attrib.get('{'+ODS['o']+'}value')
                    if v is not None:
                        for offset in range(min(repeated,40)): values[(row_number,col+offset)]=float(v)
                    col+=repeated
    cells[source['file']]=values
for record in database['records']:
    value=cells[record['source']][(record['row'],record['column'])]
    assert value==record['value'],record
assert len(database['records'])==len({(r['source'],r['row'],r['column']) for r in database['records']})
print(f"Verified {len(database['records'])} unique records against original XML cells; all {len(database['sources'])} SHA-256 hashes match.")
