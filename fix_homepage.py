from pathlib import Path
import re
p = Path('homepage.html')
text = p.read_text('utf-8')
pattern = re.compile(r'<img\s+src="data:image/png;base64,[^"]*"\s*([^>]*)>')
text, count = pattern.subn('<img src="public/favicon.svg" class="footer-logo" alt="Gifford logo">', text, count=1)
if count == 0:
    raise SystemExit('No inline image replacement found')
text = re.sub(r'<!--.*?-->', '', text, flags=re.S)
text = re.sub(r'\n{3,}', '\n\n', text)
p.write_text(text, 'utf-8')
print('updated', count)
