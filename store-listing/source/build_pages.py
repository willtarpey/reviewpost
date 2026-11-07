# Writes the store listing mockup pages. Each page shares head.html and draws real ReviewPost designs.
# Render them to PNG with render.sh.
from pathlib import Path

here = Path(__file__).parent
head = (here / 'head.html').read_text()
LOGO = '/reviewshot/assets/logo.png'

pages = {}

pages['screenshot-1-hero'] = f'''
<div class="glow" style="right:-120px;top:40px"></div>
<div class="frame">
  <div class="copy">
    <img class="logo" src="{LOGO}" alt="">
    <h1>Turn 5-star reviews into <em>scroll-stopping</em> posts</h1>
    <p class="sub">Pick a review, pick a design, download. Your happiest customers become your best marketing.</p>
    <span class="pill">✦ One click from Google &amp; Trustpilot</span>
  </div>
  <div class="stage">
    <canvas class="post" data-design="testimonial" data-sample="1" data-brand="garden" style="position:absolute;width:300px;left:30px;top:250px;transform:rotate(-7deg)"></canvas>
    <canvas class="post" data-design="glass" data-sample="0" data-brand="reviewpost" style="position:absolute;width:300px;right:20px;top:230px;transform:rotate(7deg)"></canvas>
    <canvas class="post" data-design="spotlight" data-sample="0" data-brand="reviewpost" style="position:relative;width:380px;z-index:2"></canvas>
  </div>
</div>'''

pages['screenshot-2-editor'] = f'''
<style>
  .browser {{ width: 1060px; height: 664px; border-radius: 14px; overflow: hidden; background: #0e0e10; border: 1px solid #34343a; box-shadow: 0 40px 100px rgba(0,0,0,.6); }}
  .bar {{ height: 36px; display: flex; align-items: center; gap: 8px; padding: 0 14px; background: #1b1b1f; border-bottom: 1px solid #2a2a2f; }}
  .bar i {{ width: 11px; height: 11px; border-radius: 50%; background: #3a3a40; display: block; }}
  .bar span {{ margin-left: 18px; font-size: 12px; color: #8e8e96; }}
  .viewport {{ width: 1440px; height: 900px; transform: scale(.7333); transform-origin: 0 0; }}
  .viewport iframe {{ width: 1440px; height: 900px; border: 0; display: block; }}
  .top {{ position: absolute; top: 34px; left: 0; right: 0; text-align: center; }}
  .top h1 {{ font-size: 40px; margin: 0 0 6px; }}
  .top .sub {{ font-size: 18px; }}
</style>
<div class="top"><h1>Your brand, <em>every post</em></h1><p class="sub">Match your website colours, choose fonts and styles, add your logo.</p></div>
<div style="position:absolute;left:110px;top:122px" class="browser">
  <div class="bar"><i></i><i></i><i></i><span>ReviewPost</span></div>
  <div class="viewport"><iframe id="ed"></iframe></div>
</div>
<script>
  // Seed the editor (same origin) with a demo brand kit, then load it.
  const brand = {{ businessName: 'Greenleaf Garden Centre', handle: '@greenleafgardens', website: 'greenleafgardens.co.uk',
    primary: '#22412f', accent: '#f2c46d', text: '#ffffff', colorsSet: true, font: 'jakarta', logo: null }};
  localStorage.clear();
  localStorage.setItem('rp:brands', JSON.stringify([brand]));
  localStorage.setItem('rp:plan', JSON.stringify('pro'));
  localStorage.setItem('rp:lastTemplate', JSON.stringify('glass'));
  localStorage.setItem('rp:pendingReview', JSON.stringify({{ text: 'Plenty of parking, a gorgeous café and staff who really know their plants. Our new favourite weekend spot!', name: 'Chris Hobbs', rating: 5, source: 'Google', business: '' }}));
  document.getElementById('ed').src = '/reviewshot/editor.html';
</script>'''

review_card = lambda name, initial, color, when, text: f'''
  <div class="rv">
    <div class="who"><span class="av" style="background:{color}">{initial}</span><div><b>{name}</b><small>★★★★★ · {when}</small></div></div>
    <p>{text}</p>
    <button class="rs-btn">✦ Make post</button>
  </div>'''

pages['screenshot-3-review-button'] = f'''
<style>
  .panel {{ position: relative; width: 520px; height: 640px; background: #fff; border-radius: 16px; overflow: hidden; color: #1f1f1f; box-shadow: 0 40px 100px rgba(0,0,0,.6); font-family: -apple-system, "Segoe UI", system-ui, sans-serif; }}
  .ph {{ padding: 20px 24px 14px; border-bottom: 1px solid #ececec; }}
  .ph h3 {{ margin: 0 0 4px; font-size: 20px; }}
  .ph .score {{ color: #555; font-size: 14px; }}
  .ph .score b {{ font-size: 22px; color: #1f1f1f; margin-right: 6px; }}
  .ph .score span {{ color: #f4b400; letter-spacing: 1px; }}
  .rv {{ padding: 16px 24px; border-bottom: 1px solid #f0f0f0; }}
  .who {{ display: flex; gap: 10px; align-items: center; }}
  .who b {{ display: block; font-size: 14px; }}
  .who small {{ color: #f4b400; font-size: 12px; }}
  .av {{ width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 14px; }}
  .rv p {{ margin: 8px 0 0; font-size: 14px; line-height: 1.45; color: #333; }}
  .rs-btn {{ display: inline-flex; margin: 10px 0 2px; padding: 7px 13px; border: 1px solid #16170f; border-radius: 999px; background: #eefca6; color: #16170f; font: 600 12px/1 system-ui, sans-serif; }}
  .rs-batch {{ position: absolute; right: 18px; bottom: 18px; padding: 13px 20px; border: 1.5px solid #eefca6; border-radius: 999px; background: #16170f; color: #eefca6; font: 700 14px/1 system-ui, sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,.3); }}
  .hl {{ outline: 3px solid #eefca6; outline-offset: 4px; border-radius: 999px; }}
  .arrow {{ position: absolute; color: #eefca6; font-weight: 700; font-size: 15px; }}
</style>
<div class="glow" style="right:40px;top:60px"></div>
<div class="frame" style="grid-template-columns: 430px 1fr">
  <div class="copy">
    <img class="logo" src="{LOGO}" alt="">
    <h1>One click from <em>your reviews</em></h1>
    <p class="sub">A <b style="color:#fff">Make post</b> button appears under every review on Google Maps and Trustpilot. Got lots? Batch up to 10 at once.</p>
  </div>
  <div class="stage">
    <div class="panel">
      <div class="ph"><h3>Greenleaf Garden Centre</h3><div class="score"><b>4.9</b><span>★★★★★</span> 312 reviews</div></div>
      {review_card('Sarah Mitchell', 'S', '#7b61ff', '2 days ago', 'Absolutely brilliant service from start to finish. The team went above and beyond!')}
      {review_card('Chris Hobbs', 'C', '#0f9d58', '1 week ago', 'Plenty of parking, a gorgeous café and staff who really know their plants. Our new favourite weekend spot!')}
      {review_card('Amira Khan', 'A', '#db4437', '3 weeks ago', 'Friendly, fast and fairly priced. Couldn’t ask for more.')}
      <button class="rs-batch">✦ Make posts from 10 reviews</button>
    </div>
  </div>
</div>
<script>document.querySelectorAll('.rs-btn')[1].classList.add('hl');</script>'''

grid = ''.join(
    f'<figure><canvas class="post" data-design="{d}" data-sample="{s}" data-brand="{b}"></canvas><figcaption>{d.title()}{" <span>PRO</span>" if pro else ""}</figcaption></figure>'
    for d, s, b, pro in [
        ('spotlight', 0, 'reviewpost', False), ('card', 1, 'garden', False), ('bold', 2, 'salon', False),
        ('editorial', 0, 'garden', True), ('poster', 1, 'reviewpost', True), ('neon', 2, 'salon', True),
        ('ticket', 0, 'bakery', True), ('testimonial', 1, 'garden', True), ('marker', 2, 'reviewpost', True),
    ])
pages['screenshot-4-designs'] = f'''
<style>
  .grid {{ display: grid; grid-template-columns: repeat(3, 200px); gap: 18px 20px; }}
  figure {{ margin: 0; }}
  figure canvas {{ width: 200px; border-radius: 8px; box-shadow: 0 16px 40px rgba(0,0,0,.5); }}
  figcaption {{ margin-top: 7px; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; }}
  figcaption span {{ font-size: 9px; letter-spacing: .08em; background: #eefca6; color: #16170f; border-radius: 999px; padding: 2px 6px; }}
</style>
<div class="frame">
  <div class="copy">
    <img class="logo" src="{LOGO}" alt="">
    <h1>21 designs for <em>every feed</em></h1>
    <p class="sub">From clean and minimal to neon, tickets and polaroids. Every design works as an Instagram post, a Story and a LinkedIn post.</p>
    <span class="pill">3 free · 18 Pro · more on the way</span>
  </div>
  <div class="stage"><div class="grid">{grid}</div></div>
</div>'''

pages['screenshot-5-brand'] = f'''
<style>
  .match {{ width: 640px; background: #1f1f23; border: 1px solid #34343a; border-radius: 16px; padding: 18px; margin-bottom: 26px; }}
  .match label {{ display: block; font-weight: 700; font-size: 14px; margin-bottom: 10px; }}
  .match .row {{ display: flex; gap: 10px; }}
  .match .input {{ flex: 1; background: #111113; border: 1px solid #eefca6; border-radius: 12px; padding: 13px 14px; font-size: 15px; }}
  .match .btn {{ border: 0; border-radius: 12px; padding: 0 22px; background: #eefca6; color: #16170f; font-weight: 700; font-size: 15px; display: grid; place-items: center; }}
  .match .ok {{ margin-top: 12px; font-size: 13.5px; color: #a1a1aa; display: flex; align-items: center; gap: 6px; }}
  .match .ok i {{ width: 16px; height: 16px; border-radius: 4px; display: inline-block; border: 1px solid rgba(255,255,255,.2); }}
  .row3 {{ display: flex; gap: 20px; }}
  .row3 figure {{ margin: 0; }}
  .row3 canvas {{ width: 200px; }}
  .row3 figcaption {{ margin-top: 10px; font-size: 13px; color: #a1a1aa; text-align: center; }}
  .row3 figcaption b {{ color: #fff; display: block; font-size: 14px; }}
</style>
<div class="glow" style="right:60px;top:100px"></div>
<div class="frame">
  <div class="copy">
    <img class="logo" src="{LOGO}" alt="">
    <h1>Match your brand in <em>one click</em></h1>
    <p class="sub">Type in your website and ReviewPost picks up your colours. Agencies can keep up to 5 brand kits for their clients.</p>
  </div>
  <div class="stage" style="display:flex;flex-direction:column;justify-content:center">
    <div class="match">
      <label>Your website</label>
      <div class="row"><div class="input">greenleafgardens.co.uk</div><div class="btn">Match</div></div>
      <div class="ok"><i style="background:#22412f"></i><i style="background:#f2c46d"></i> Matched colours from greenleafgardens.co.uk</div>
    </div>
    <div class="row3">
      <figure><canvas class="post" data-design="card" data-sample="1" data-brand="garden"></canvas><figcaption><b>Greenleaf</b>Garden centre</figcaption></figure>
      <figure><canvas class="post" data-design="card" data-sample="0" data-brand="bakery"></canvas><figcaption><b>Crumb &amp; Co.</b>Bakery</figcaption></figure>
      <figure><canvas class="post" data-design="card" data-sample="2" data-brand="salon"></canvas><figcaption><b>Studio Nine</b>Hair salon</figcaption></figure>
    </div>
  </div>
</div>'''

pages['promo-small'] = f'''
<style>
  body {{ width: 440px; height: 280px; }}
  .wrap {{ position: relative; height: 100%; padding: 30px 28px; }}
  .wrap .logo {{ height: 20px; }}
  .wrap h1 {{ font-size: 27px; margin: 18px 0 0; max-width: 220px; line-height: 1.08; }}
  .wrap .p1 {{ position: absolute; width: 150px; right: 26px; top: 46px; transform: rotate(6deg); }}
  .wrap .p2 {{ position: absolute; width: 120px; right: 128px; top: 128px; transform: rotate(-8deg); }}
</style>
<div class="glow" style="width:420px;height:420px;right:-140px;top:-120px"></div>
<div class="wrap">
  <img class="logo" src="{LOGO}" alt="">
  <h1>Reviews into <em>social posts</em></h1>
  <canvas class="post p2" data-design="poster" data-sample="1" data-brand="reviewpost"></canvas>
  <canvas class="post p1" data-design="spotlight" data-sample="0" data-brand="reviewpost"></canvas>
</div>'''

pages['promo-marquee'] = f'''
<style>
  body {{ width: 1400px; height: 560px; }}
  .frame {{ grid-template-columns: 520px 1fr; padding: 0 80px; }}
  h1 {{ font-size: 58px; }}
</style>
<div class="glow" style="right:80px;top:-120px"></div>
<div class="frame">
  <div class="copy">
    <img class="logo" src="{LOGO}" alt="">
    <h1>Turn 5-star reviews into <em>scroll-stopping</em> posts</h1>
    <p class="sub">One click from Google &amp; Trustpilot. Your brand, every post.</p>
  </div>
  <div class="stage">
    <canvas class="post" data-design="editorial" data-sample="0" data-brand="garden" style="position:absolute;width:250px;left:20px;top:150px;transform:rotate(-8deg)"></canvas>
    <canvas class="post" data-design="luxe" data-sample="1" data-brand="bakery" style="position:absolute;width:250px;right:10px;top:140px;transform:rotate(8deg)"></canvas>
    <canvas class="post" data-design="glass" data-sample="0" data-brand="reviewpost" style="position:relative;width:310px;z-index:2"></canvas>
  </div>
</div>'''

for name, body in pages.items():
    (here / f'{name}.html').write_text(f'<!doctype html>\n<html lang="en">\n<head>\n{head}<title>{name}</title>\n</head>\n<body>\n{body}\n</body>\n</html>\n')
    print('wrote', name)
