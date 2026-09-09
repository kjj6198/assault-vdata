"""Download the ministry's spreadsheets; preserve originals and SHA-256 provenance."""
import concurrent.futures, hashlib, html, json, pathlib, re, urllib.parse, subprocess
ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCES = {'relationships': '59308', 'demographics': '59309', 'victims': '59311', 'reports': '59312'}

def get(url):
    return subprocess.check_output(['curl', '--fail', '--location', '--silent', '--show-error', '--retry', '3', '--max-time', '60', url])

def source_files(item):
    kind, page_id = item
    page = f'https://dep.mohw.gov.tw/dops/cp-1303-{page_id}-105.html'
    body = get(page).decode('utf-8')
    (ROOT / 'data/raw' / f'{kind}.html').write_text(body)
    links = []
    for href, title in re.findall(r'<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', body, re.S):
        title = html.unescape(re.sub('<[^>]+>', '', title)).strip()
        if not re.search(r'\.(xlsx|ods)$', title): continue
        years = re.findall(r'20\d{2}', title)
        if not years: continue
        links.append((href, title, '-'.join(years), title.rsplit('.', 1)[1]))
    # Prefer XLSX; one year (2023 relationships) is only published as ODS.
    selected = {}
    for link in links:
        key = link[2]
        if key not in selected or link[3] == 'xlsx': selected[key] = link
    files = []
    for href, title, years, ext in selected.values():
        url = urllib.parse.urljoin(page, html.unescape(href))
        name = f'{kind}-{years}.{ext}'
        path = ROOT / 'data/raw' / name
        path.write_bytes(get(url))
        files.append({'dataset': kind, 'file': name, 'title': title, 'page': page, 'url': url, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
        print(name, flush=True)
    if not files: raise ValueError(f'No files discovered: {page}')
    return files

if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        files = [f for group in pool.map(source_files, SOURCES.items()) for f in group]
    # Keep the user-supplied, pinned suspect workbook when refreshing the other sources.
    files.extend(s for s in json.loads((ROOT / 'data/sources.json').read_text()) if s['dataset'] == 'suspects')
    (ROOT / 'data/sources.json').write_text(json.dumps(files, ensure_ascii=False, indent=2) + '\n')
