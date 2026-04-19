let grasses = []; // 儲存每一根水草屬性的陣列
let bubbles = []; // 儲存水泡的陣列

function setup() {
  // 設定畫布為全螢幕寬高
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.style('position', 'fixed'); // 確保畫布固定在視窗最上方，不隨內容流動
  canvas.style('top', '0');
  canvas.style('left', '0');
  canvas.style('pointer-events', 'none'); // 關鍵設定：將 pointer-events 設為 none，讓滑鼠可以穿透畫布點選 iframe 網頁內容
  canvas.style('z-index', '1'); // 確保畫布在 iframe 之上

  // 產生全螢幕 iframe
  let iframe = createElement('iframe');
  iframe.attribute('src', 'https://www.et.tku.edu.tw');
  iframe.style('position', 'fixed');
  iframe.style('top', '0');
  iframe.style('left', '0');
  iframe.style('width', '100%');
  iframe.style('height', '100%');
  iframe.style('border', 'none');
  iframe.style('z-index', '0'); // iframe 在畫布之下 (改為 0 避免被 body 背景遮擋，但仍小於 canvas 的 1)
  iframe.style('pointer-events', 'auto'); // 確保 iframe 可以接收滑鼠事件

  // 指定顏色陣列
  let colors = ['#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1'];

  // 在 setup 中預先產生 50 根水草的屬性
  for (let i = 0; i < 50; i++) {
    grasses.push({
      // 屬性：顏色
      c: random(colors), 
      // 屬性：高度 (儲存比例，讓視窗縮放時能適應，約 0.36 ~ 0.54 倍螢幕高)
      hRate: 0.45 * random(0.8, 1.2), 
      // 屬性：粗細 (亂數產生 10~20 之間)
      w: random(10, 20),
      // 屬性：搖晃頻率 (每個水草搖的速度不一樣)
      shakeSpeed: random(0.002, 0.008),
      // 屬性：搖晃的雜訊偏移值 (確保每根草搖起來不一樣)
      noiseOffset: random(1000)
    });
  }
}

function draw() {
  // 畫布背景顏色 (ade8f4) 轉為 rgba 且透明度為 0.2
  clear(); // 清除畫布，避免半透明背景疊加
  background('rgba(173, 232, 244, 0.2)');
  

  // 設定混合模式為 BLEND，產生透明重疊效果
  blendMode(BLEND);

  strokeCap(ROUND);  // 頂端圓角
  noFill();

  // 讀取陣列並繪製
  for (let j = 0; j < grasses.length; j++) {
    let g = grasses[j]; // 取得當前水草物件
    
    let c = color(g.c); // 先將 HEX 字串轉換為 p5 的 Color 物件
    c.setAlpha(60);     // 設定透明度
    stroke(c);          // 套用帶有透明度的顏色
    strokeWeight(g.w);  // 套用粗細
    
    beginShape();
    // 位置仍依據索引均勻分布
    let startX = map(j, 0, grasses.length - 1, width * 0.05, width * 0.95); 
    let startY = height;
    let grassHeight = height * g.hRate; // 套用高度
    
    let points = 30; // 每根草的節點數
    for (let i = 0; i <= points; i++) {
      let t = i / points;
      let y = lerp(startY, height - grassHeight, t);
      
      // 使用物件中的 noiseOffset 與 shakeSpeed
      let offsetX = map(noise(g.noiseOffset + i * 0.02, frameCount * g.shakeSpeed), 0, 1, -80, 80) * t;
      let x = startX + offsetX;
      
      curveVertex(x, y);
      if (i === 0 || i === points) curveVertex(x, y);
    }
    endShape();
  }

  // --- 水泡效果邏輯 ---
  // 隨機產生水泡 (約每 20 幀產生一個)
  if (random(1) < 0.05) {
    bubbles.push({
      x: random(width),            // 隨機水平位置
      y: height + 10,              // 從底部下方開始
      size: random(5, 15),         // 大小
      speed: random(1, 3),         // 上升速度
      popY: random(height * 0.2, height * 0.8), // 隨機設定破掉的高度 (y座標)
      popping: false,              // 是否正在破裂
      popTimer: 0                  // 破裂動畫計時
    });
  }

  // 更新與繪製所有水泡
  for (let i = bubbles.length - 1; i >= 0; i--) {
    let b = bubbles[i];
    
    if (b.popping) {
      // 破裂效果：畫一個快速擴大並消失的圓圈
      b.popTimer++;
      let alpha = map(b.popTimer, 0, 10, 200, 0); // 漸漸透明
      let r = b.size + b.popTimer * 3; // 半徑快速擴大
      
      stroke(255, alpha);
      strokeWeight(2);
      noFill();
      ellipse(b.x, b.y, r, r);
      
      if (b.popTimer > 10) bubbles.splice(i, 1); // 動畫結束後移除
    } else {
      // 正常上升
      b.y -= b.speed;
      b.x += map(noise(b.x, frameCount * 0.01), 0, 1, -1, 1); // 輕微左右漂移
      
      stroke(255, 180);
      strokeWeight(1.5);
      fill(255, 40); // 半透明填充
      // 水泡本體：白色，透明度 0.5 (約127)
      noStroke();
      fill(255, 127);
      ellipse(b.x, b.y, b.size);
      // 水泡上面的圓圈 (光點)：白色，透明度 0.7 (約178)
      fill(255, 178);
      ellipse(b.x + b.size * 0.25, b.y - b.size * 0.25, b.size * 0.3);
      
      // 檢查是否到達破裂高度
      if (b.y < b.popY) b.popping = true;
    }
  }
}

// 當瀏覽器視窗大小改變時，自動重新調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}