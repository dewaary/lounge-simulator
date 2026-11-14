import sys
js=open('/tmp/prev.js').read().replace('</script','<\\/script')
css=open('app/globals.css').read()
html=f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The Lounge · 3D Event Planner</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Manrope:wght@400;500;600;700&display=swap">
<style>{css}</style></head>
<body><div id="root"></div><script>{js}</script></body></html>'''
open(sys.argv[1],'w').write(html)
