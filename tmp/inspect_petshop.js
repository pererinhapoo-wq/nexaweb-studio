async function test() {
  try {
    const res = await fetch("https://pet-shop-personalidade-e-profission.vercel.app/assets/index-CylLt_nL.js");
    const text = await res.text();
    
    const idx = text.indexOf("profissional:{name:");
    if (idx !== -1) {
      console.log("TIER BLOCK:", text.slice(idx - 20, idx + 800));
    }

    const images = [...text.matchAll(/["'`](\/assets\/[^"'`]+\.(?:jpg|jpeg|png|webp|svg))["'`]/g)].map(m => m[1]);
    console.log("IMAGES:", [...new Set(images)]);

    const prices = text.match(/R\$\s*[\d\.,]+/g);
    console.log("PRICES FOUND:", [...new Set(prices)]);

    // Check if there are plan prices mentioned
    const planPrices = text.match(/.{0,50}(1\.700|2\.800|4\.500|Plano|Nível).{0,50}/g);
    console.log("PLAN MENTIONS:", planPrices ? planPrices.slice(0, 10) : []);
  } catch (err) {
    console.error(err);
  }
}
test();
