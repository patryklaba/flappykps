const canvas = document.querySelector('#screen');
const ctx = canvas.getContext('2d');

const imgMap = {};
const imageNames = ['bg2', 'fg2', 'pipeBottom2', 'pipeTop2'];
let dev = false;
let score = 0;
let paused = false;


const fail = new Audio();
fail.src = dev ? '/sound/fail.mp3' : '/flappykps/sound/fail.mp3';

const succ = new Audio();
succ.src = dev ? '/sound/succ.mp3' : '/flappykps/sound/succ.mp3';


fail.addEventListener('ended', () => {
  window.location.reload();
});


const OPTIONS = {
  GRAV: 1.2, 
  JUMP: 25,
  PIPE_GAP: 100,
  OBSTACLE_SPAWN_X: 288,
  OBSTACLE_HEIGHT: 242,
  OBSTACLE_WIDTH: 52
}

function loadImage (fileName) {
  return new Promise(resolve => {
    const img = new Image();
    img.addEventListener('load', () => {
      imgMap[fileName] = img;
      resolve(img);
    });
    const url = dev ? `/img/${fileName}.png` :`/flappykps/img/${fileName}.png`;
    img.src = url;
  });
}

function loadSound (name) {
  return new Promise(resolve => {
    const sound = new Audio();
    sound.addEventListener('load', () => {
      resolve(sound);
    });
    const url = `/sound/${name}.mp3`;
    sound.src = url;
  });
}

function loadSounds(callback) {
  const promises = [];
  promises.push(loadSound('fail'));
  promises.push(loadSound('succ'));
  promises.push(loadSound('fly'));

  return promises;
}

function loadImages(files, callback) {
  const promises = [];
  files.forEach(file => {
    promises.push(loadImage(file));
  })
  Promise.all(promises).then( () => {
    callback();
  });
}


function init () {
  return new Promise( resolve => {
    loadImages(imageNames, () => {
      resolve();
    })
  })
};

function draw(imgName, x, y) {
  ctx.drawImage(imgName, x, y);
}


class Bird {
  constructor (x, y)  {
    this.x = x;
    this.y = y;
    this.img = null;
    this.forehead = null;
  }

  async initialize () {
    const image = await loadImage('kps');
    this.img = image; 
    this.forehead = this.x + image.width;
    return image;
  }

  jump () {
    this.y -= OPTIONS.JUMP;
  }

  draw(x = this.x, y = this.y) {
    ctx.drawImage(this.img, x, y);
  }
}

function generateObstaclesYCoord (xCord) {
  // top left corner of the canvas is the (0,0) point in cartesian coord.system
  // pipe's height is 242px so I have to generate a random number in range (-242, 0)
  // however, if the yTop would be exactly -242 top obstacle will be invisible, therfore
  // I will generate a rand.number in range (-200, 0);
  const min = -200;
  const max = 0; 
  const height = OPTIONS.OBSTACLE_HEIGHT;
  const width = OPTIONS.OBSTACLE_WIDTH;
  const yTop = Math.floor(Math.random() * (max+min));
  const yBottom = yTop + 242 + OPTIONS.PIPE_GAP;
  const x = xCord || OPTIONS.OBSTACLE_SPAWN_X;
  return {
    yTop,
    yBottom,
    x,
    height,
    width
  };
}

function drawObstacles(coords) {
  ctx.drawImage(imgMap.pipeTop2, coords.x, coords.yTop);
  ctx.drawImage(imgMap.pipeBottom2, coords.x, coords.yBottom);
}



let obstaclesX = 288;
const obstacles = [];
function run (player) {
  let {bg2, fg2, pipeTop2, pipeBottom2} = imgMap;
  draw(bg2, 0, 0);

  player.draw();
  player.y += OPTIONS.GRAV;
  if (obstacles[0].x < 120 && obstacles.length < 2) {
    obstacles.push(generateObstaclesYCoord());
  }

  if (obstacles[0].x < -52) {
    obstacles.shift();
  }
  
  if (obstacles[0].x + OPTIONS.OBSTACLE_WIDTH === 24) {
    score++;
    succ.play();
  }
  
  obstacles.forEach(obstacle => {
    drawObstacles(obstacle);
    obstacle.x--;
  });

  detectCollision(player);
  
  draw(fg2, 0, canvas.height - fg2.height);
  drawScore();
  drawCopy();
  if(!paused) {
    requestAnimationFrame(() => run(player));
  }
}

function detectCollision(player) {
  const collide = (el) => {
    return (el.x === player.forehead && ((player.y < el.yTop + el.height) || (player.y+player.img.height > el.yBottom)))
     || (player.y < el.yTop + el.height && (player.forehead > el.x && player.x <= el.x + el.width)) || 
     (player.y + player.img.height > el.yBottom && (player.forehead > el.x && player.forehead <= el.x + el.width)) || 
     (player.y + player.img.height >= canvas.height - imgMap.fg2.height);
  }

  if(obstacles.some(collide)) {
    paused = !paused;
    fail.play();
  }
}

function jump (player) {
  player.jump();
}

function drawScore () {
  ctx.fillStyle = "#fff";
  ctx.font = "20px Verdana";
  ctx.fillText(`Kolejka: ${score}`, 10, 485);
}

function drawCopy() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "12px Verdana";
  ctx.fillText(`Made 4fun by Łabski`, 80, 505);
}

function once(fn, context) { 
	let result;

	return function() { 
		if(fn) {
			result = fn.apply(context || this, arguments);
			fn = null;
		}

		return result;
	};
}

const allowSound = once( () => {
  fail.play();
  fail.pause();

  succ.play();
  succ.pause();
});
  


init()
  .then( () => {
    const player = new Bird(25, 150);
    obstacles.push(generateObstaclesYCoord(260));
    player.initialize()
      .then( () => {
        window.addEventListener('keyup', () => {
          jump(player);
        });
        window.addEventListener('touchstart', () => {
          allowSound();
          jump(player);
        });
        window.addEventListener('mousedown', () => {
          allowSound();
          jump(player);
        });
        run(player);
      });
  });











