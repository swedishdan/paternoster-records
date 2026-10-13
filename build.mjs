// Inlines src/ into one page.
//   dist/index.html  - the deployable site (full document)
//   artifact.html    - the same page without the document shell (Claude artifact)
import fs from 'node:fs';
const src = f => fs.readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
const js = ['data.js', 'covers.js', 'audio.js', 'main.js'].map(src).join('\n');
const body = src('index.html')
  .replace('<!-- @css -->', () => '<style>\n' + src('site.css') + '\n</style>')
  .replace('<!-- @js -->', () => '<script>\n' + js + '\n</script>');
const [head, rest] = [body.slice(0, body.indexOf('<svg width="0"')), body.slice(body.indexOf('<svg width="0"'))];
fs.mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./dist/index.html', import.meta.url),
  '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="theme-color" content="#1F45A8">\n<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 28 44%22%3E%3Cpath d=%22M3 14A11 11 0 0 1 25 14L25 30A11 11 0 0 1 3 30Z%22 fill=%22none%22 stroke=%22%231F45A8%22 stroke-width=%224%22/%3E%3C/svg%3E">\n' + head + '</head>\n<body>\n' + rest + '\n</body>\n</html>\n');
fs.writeFileSync(new URL('./artifact.html', import.meta.url), body);
console.log('built', (body.length / 1024).toFixed(1) + ' KB');
