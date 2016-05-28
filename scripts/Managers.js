const PIXI = require('pixi.js');
let SU = require('./SpriteUtilities');
SU = new SU(PIXI);
const $ = require('jquery');
const vex = require('vex-js');
const _ = require('lodash');

const centerAndScaleContainer = ({container, screen, targetAspect}) => {
  let width = screen.width;
  let height = screen.height;

  let spriteWidth = container.children[0].width;
  let spriteHeight = container.children[0].height;

  if (width == height) {
    // window fits properly,
    container.scale = width / spriteWidth;
  } else if (width > height) {
    let scale = height / spriteHeight;
    container.scale.x = container.scale.y = scale;
    container.position.x = width / 2 - (spriteWidth / 2 * scale);

  } else {
    // taller
    let scale = width / spriteWidth;
    container.scale.x = container.scale.y = scale;
    container.position.y = height / 2 - (spriteHeight / 2 * scale);
  }

  return container;
};

export class BackgroundManager {
  constructor({screen, targetAspect, bg, size, container, bioBoxes}) {
    this.container = container;
    this.bioBoxes = bioBoxes.map(bio => {
      let texture = new PIXI.Texture(new PIXI.BaseTexture(bio.data))
      return { name: bio.name, texture}
    });
    this._layers = bg.map(layer => {
      let texture = new PIXI.extras.TilingSprite(new PIXI.Texture(new PIXI.BaseTexture(layer.data)));
      texture.width = size.width;
      texture.height = size.height;
      texture.vx = 0;
      texture.tilePosition.x = 0;
      return {
        layer: Number(layer.layer),
        texture: texture
      }
    });

    this.bioContainer = new PIXI.Container();

    this._layers.forEach(layer => {
      this.container.addChild(layer.texture)
    });

    this._moveableLayers = this._layers.filter(layer => {
      return layer.layer != 1;
    });
    this.container = centerAndScaleContainer({
      container: this.container,
      screen,
      targetAspect
    });
    this.scale = this.container.scale;
    this.container.addChild(this.bioContainer);
  }

  addBio(name) {
    this.bioBoxes.filter(bio => {
      return bio.name === name
    }).forEach(bio => {
      let sprite = SU.sprite(bio.texture);
      this.bioContainer.addChild(sprite);
    })
    // console.log(this.bioBoxes);
    // console.log(this.bioContainer);
  }

  removeBio(name) {
    this.bioContainer.removeChildren()
  }

  move(velocity) {

    this._moveableLayers.map((layer) => {
      let sprite = layer.texture;
      let speed = layer.layer;
      let multi = 0;

      if (speed === 3) {
        multi = 1;
      } else if (speed === 2) {
        multi = 1 / 4;
      } else {
        multi = 1 / 8;
      }
      sprite.vx = velocity * multi;
    })
  }
}

export class CharacterManager {
  constructor({screen, targetAspect, container, chars, profiles, backgroundManager}) {
    this.backgroundManager = backgroundManager;
    for (let char in chars) {
      let resources = chars[char].map(data => {
        return new PIXI.Texture(new PIXI.BaseTexture(data.data))
      });
      let sprite = SU.sprite(resources);
      sprite.visible = false;
      sprite.loop = false;
      // sprite.onComplete = function(){};
      sprite.fps = 16;
      sprite.states = {
        begin: 0,
        middle: 16,
        end: 31,
        hover: [0, 16],
        click: [17, 32],
        touch: [0, 32],
        rHover: [49, 66],
        rclick: [33, 48],
        rtouch: [33, 66]
      };
      sprite.__profile__ = profiles[char];
      sprite.vx = 0;
      sprite.show(sprite.states.begin);
      container.addChild(sprite);
    }
    this.container = container;
    this._index = 0;
    this.container.children[0].visible = true;
    centerAndScaleContainer(
      {
        container: this.container,
        screen, targetAspect
      })
  }

  displayBioBox() {
    let name = this.getCurrentSprite().__profile__.name;
    this.backgroundManager.addBio(name)
  }

  removeBioBox() {
    let name = this.getCurrentSprite().__profile__.name;
    this.backgroundManager.removeBio(name)
  }

  getCurrentSprite() {
    return this.container.children[this._index];
  }

  getNextSprite() {
    this._index = this._index + 1 < this.container.children.length ? this._index + 1 : 0;
    return this.container.children[this._index];
  }

  getPrevSprite() {
    this._index = this._index - 1 > -1 ? this._index - 1 : this.container.children.length - 1;
    return this.container.children[this._index];
  }

  rotateRight() {
    return {
      currentSprite: this.getCurrentSprite(),
      nextSprite: this.getNextSprite()
    }
  }

  rotateLeft() {
    return {
      currentSprite: this.getCurrentSprite(),
      prevSprite: this.getPrevSprite()
    }
  }
}

export class UIManager {
  constructor({container, screen, scale, size, windowBindingFunc}) {

    this.bindingFunc = windowBindingFunc;

    let spriteWidth = size.width * scale;
    let spriteHeight = size.height * scale;

    // this.bioBox = this.createBioBox({spriteWidth, spriteHeight, screen});

    this.screenArea = new PIXI.Container();
    this.screenArea.position.x = screen.width / 2 - spriteWidth / 2;
    this.screenArea.position.y = (screen.height - spriteHeight) / 2;
    this.screenArea.width = spriteWidth;
    this.screenArea.height = spriteHeight;

    this.leftBar = new PIXI.Graphics();
    this.leftBar.beginFill(0x000000, 1);
    this.leftBar.drawRect(0, 0, screen.width / 2 - spriteWidth / 2, screen.height);
    this.leftBar.endFill();

    this.rightBar = new PIXI.Graphics();
    this.rightBar.beginFill(0x000000, 1);
    this.rightBar.drawRect(screen.width / 2 + spriteWidth / 2, 0, spriteWidth, screen.height);
    this.rightBar.endFill();

    this.characterBounds = new PIXI.Graphics();
    this.characterBounds.beginFill(0xFFFFFF, 0);
    this.characterBounds.drawRect(spriteWidth / 4, spriteHeight / 4, spriteWidth / 2, spriteHeight * 3 / 4);
    this.characterBounds.endFill();
    this.characterBounds.interactive = true;

    this.titleBox = new PIXI.Graphics();
    this.titleBox.beginFill(0x00FF00, 0);
    this.titleBox.drawRect(spriteWidth / 40, 0, spriteWidth / 3.2, spriteHeight / 9);
    this.titleBox.endFill();
    this.titleBox.interactive = true;

    this.screenShieldContainer = new PIXI.Container();
    this.screenShieldContainer.position.x = screen.width / 2 - spriteWidth / 2;
    this.screenShieldContainer.position.y = (screen.height - spriteHeight) / 2;
    this.screenShieldContainer.width = spriteWidth;
    this.screenShieldContainer.height = spriteHeight;

    this.screenShield = new PIXI.Graphics();
    this.screenShield.beginFill(0x000000, 1);
    this.screenShield.drawRect(0, 0, spriteWidth, spriteHeight);
    this.screenShield.endFill();
    this.screenShield.interactive = true;

    this.screenShieldContainer.addChild(this.screenShield);
    this.screenShieldContainer.visible = false;

    let ratio = 281 / 500;
    let vidWidth = screen.width * 2/3;
    let vidHeight = ratio * vidWidth;
    this.video = $('<div id="videoFrame"></div>');
    this.video.css({
      "position": "absolute",
      "top": screen.height/2 - vidHeight/2,
      "left": screen.width/2 - vidWidth/2,
      // width: vidWidth,
      // height: vidHeight
    });
    this.vidWidth = vidWidth;
    this.vidHeight = vidHeight;

    this.closeBtn = $("<i id='closeBtn' class='fa fa-arrow-circle-o-left fa-3x'></i>");
    this.closeBtn.css({
      position: 'absolute',
      left: "5px",
      top: "5px"
    });

    this.iconBox = $("<div id='iconBox'></div>");
    this.iconBox.css({
      position: 'absolute',
      left: (screen.width - spriteWidth)/2 + 40,
      bottom: (screen.height - spriteHeight)/2 + 40,
      'background-color': "transparent",
      padding: '1em'
    });
    let twitterUrl = "https://twitter.com/intent/tweet/?url=http%3A%2F%2Fblacksciencematters.com&hashtags=blacksciencematters&via=BlkScienceMtrs";
    this.twitter = $(`<a href="${twitterUrl}" target="_blank">
          <i class='fa fa-twitter fa-2x'></i>
        </a>`);
    this.fb = $("<i class='fa fa-facebook-square fa-2x'></i>");
    this.fb.on('click', function() {
      FB.ui({
        method: 'share',
        href: 'http://www.blacksciencematters.com',
      }, function(response){});
    });
    this.credits = $(`<i class="fa fa-copyright fa-2x"></i>`);
    this.credits.on('click', function() {
      // vex.dialog.alert('xxx')
      let contentBlock = [
        {
          heading: "Online development and coding",
          people: [
            {
              name: "Eli Murray",
              email: "ejmurra2@gmail.com"
            }
          ]
        },
        {
          heading: "Cinematography and video production",
          people: [
            {
              name: "Tyler Davis",
              email: "tallyndavis@comcast.net"
            },
            {
              name: "Ava Kelley",
              email: "arkelle2@illinois.edu"
            },
            {
              name: "Christine La",
              email: "christinela628@gmail.com"
            },
            {
              name: "Eli Murray",
              email: "ejmurra2@gmail.com"
            },
            {
              name: "Taylor Lucero",
              email: "taylor.lucero@gmail.com"
            },
            {
              name: "Teryn Payne",
              email: "tpayne2@illinois.edu"
            }
          ]
        },
        {
          heading: "Video editing, post production and opening essay",
          people: [
            {
              name: "Zila Renfro",
              email: "zila.renfro@gmail.com"
            },
          ]
        },
        {
          heading: "Caricatures and background art",
          people: [
            {
              name: "Kaixin Ding",
              email: "dingkaixin221@gmail.com"
            },
          ]
        },
        {
          heading: "Comic style illustrations for 'I Quit'",
          people: [
            {
              name: "Griffin Tucker",
              email: "griffinavtucker@gmail.com"
            },
          ]
        },
        {
          heading: "Graphic design",
          people: [
            {
              name: "Chelsea Choi",
              email: "chelseajchoi@gmail.com"
            },
          ]
        },
        {
          heading: "Concept and production supervision",
          people: [
            {
              name: "Charles \"Stretch\" Ledford",
              email: "stretch@illinois.edu"
            },
          ]
        }
      ];
      let content = "";

      for (let block of contentBlock) {
        let openString = `<h4 style="text-align:center;" class="creditBlock">${block.heading}</h4>`;
        let middleString = "";
        for (let person of block.people) {
          middleString +=
            `<div class="creditRow"><span class="creditName">${person.name}</span><span class="creditEmail">${person.email}</span></div>`
        }
        content += `${openString}${middleString}`;
      }

      content += "<p style='margin-top: 2em; font-size: .75em; margin-bottom: -1em;'>©2015/2016 The Board of Trustees at the University of Illinois</p>"

      vex.open({
        content: content,
        showCloseButton: false,
        escapeButtonCloses: true,
        overlayClosesOnClick: true,
        appendLocation: 'body',
        className: '',
        css: {
        },
        overlayClassName: '',
        overlayCSS: {
          opacity: '.4'
        },
        contentClassName: '',
        contentCSS: {
          position: 'absolute',
          'background-color': "#dddddd",
          width: spriteWidth * 3/4,
          height: '70vh',
          left: (screen.width - spriteWidth)/2 + spriteWidth/8,
          top: '15vh',
          overflow: 'auto',
          "border-radius": '10px',
          padding: '1.2em'
        },
        closeClassName: '',
        closeCSS: {
          position: 'relative',
          left: 0,
          top: 0,
          color: 'red',
          'background-color': '#dddddd'
        }
      })
    });



    // this.prev = new PIXI.Graphics();
    // this.prev.beginFill(0x0000FF, .5);
    // this.prev.drawRect(0, spriteHeight / 3, spriteWidth / 10, spriteHeight / 3);
    // this.prev.endFill();
    // this.prev.interactive = true;

    // this.next = new PIXI.Graphics();
    // this.next.beginFill(0x0000FF, .5);
    // this.next.drawRect(spriteWidth * 9 / 10, spriteHeight / 3, spriteWidth / 10, spriteHeight / 3);
    // this.next.endFill();
    // this.next.interactive = true;

    this.next = $(`
        <div id="next">
          <i class="fa fa-angle-right fa-5x"></i>
        </div>
    `);
    this.next.css({
      position: 'absolute',
      right: (screen.width - spriteWidth)/2 + 40,
      "background-color": "#b28950",
      top: (screen.height - spriteHeight)/2 + spriteHeight/2,
      margin: 0,
      padding: "20px",
      cursor: "pointer",
      "border-radius": "15px",
      // visibility: "hidden"
    });

    this.prev = $(`
        <div id="prev">
          <i class="fa fa-angle-left fa-5x"></i>
        </div>
    `);
    this.prev.css({
      position: 'absolute',
      left: (screen.width - spriteWidth)/2 + 40,
      "background-color": "#b28950",
      top: (screen.height - spriteHeight)/2 + spriteHeight/2,
      margin: 0,
      padding: "20px",
      cursor: "pointer",
      "border-radius": "15px",
      // visibility: "hidden"
    });

    let body = $('body');
    this.screenArea.addChild(this.characterBounds);
    this.screenArea.addChild(this.titleBox);
    body.append(this.prev, this.next, this.video, this.closeBtn, this.iconBox);
    this.iconBox.append(this.twitter, this.fb, this.credits);

    container.addChild(this.screenArea);
    container.addChild(this.rightBar);
    container.addChild(this.leftBar);
    container.addChild(this.screenShieldContainer);
    this.container = container;
    this.spriteWidth = spriteWidth;
    this.spriteHeight = spriteHeight;
  }

  // createBioBox({spriteWidth, spriteHeight, screen}) {
  //   let box = $("<div id='bioBox'></div>");
  //   box.css({
  //     position: 'absolute',
  //     border: '2px solid black',
  //     "border-radius": "15px",
  //     "background-color": "#B28950",
  //     right: screen.width / 2 - spriteWidth / 2 + spriteWidth / 10,
  //     bottom: spriteHeight / 10,
  //     visibility: 'hidden',
  //     width: 3 / 5 * spriteWidth / 4
  //   });
  //   $('body').append(box);
  //   return box;
  // }

  removeScreenArea() {
    this.screenArea.visible = false;
    // this.hideBio();
    this.iconBox.css({visibility: 'hidden'});
    this.next.css({visibility: 'hidden'});
    this.prev.css({visibility: 'hidden'});
  }

  // showBio({charProf}) {
  //   let name = charProf.name;
  //   let biolines = charProf.bio;
  //   for (let line of biolines) {
  //     let piece = $(`
  //       <span>${line.heading}</span>
  //       <span>${line.text}</span>
  //     `)
  //     this.bioBox.append(piece);
  //   }
  //   this.bioBox.css({
  //     visibility: "visible"
  //   })
  // }

  // hideBio() {
  //   this.bioBox.css({
  //     visibility: "hidden"
  //   })
  // }

  showScreenArea({characterManager}) {
    this.screenArea.visible = true;
    let charProf = characterManager.getCurrentSprite().__profile__;
    // this.showBio({charProf});
    this.iconBox.css({visibility: 'visible'});
    this.next.css({visibility: 'visible'});
    this.prev.css({visibility: 'visible'});
  }

  addScreenShield() {
    this.screenShieldContainer.visible = true;
    $(window).unbind('resize');
    this.closeBtn.css({
      visibility: 'visible'
    })
  }

  removeScreenShield() {
    this.screenShieldContainer.visible = false;
    this.closeBtn.css({
      visibility: 'hidden'
    });
    $(window).on('resize', this.bindingFunc);
    this.player.stopVideo();
    $('#videoFrame').remove();
    $('body').append(this.video);
  }

  setup({backgroundManager, characterManager}) {

    this.backgroundManager = backgroundManager;
    this.characterManager = characterManager;

    let showVid = () => {
      this.addScreenShield();
      this.player = new YT.Player('videoFrame', {
        height: this.vidHeight,
        width: this.vidWidth,
        videoId: this.characterManager.getCurrentSprite().__profile__.video,
        events: {
          'onReady': onPlayerReady,
          // 'onStateChange': onPlayerStateChange
        }
      });
      $('#videoFrame').css({
        visibility: 'visible'
      });
      // let vidUrl = String(this.characterManager.getCurrentSprite().__profile__.video);
      // let vidOpts = "'?rel=0&autoplay=1";
      // this.video.attr('src', vidUrl + vidOpts);
      // this.video.css({visibility: 'visible'})
    };

    let displayVid = () => {
      this.removeScreenArea();
      let currSprite = characterManager.getCurrentSprite();
      currSprite.playAnimation([currSprite.states.click[0], currSprite.states.click[1] - 1], currSprite.states.end - 1, showVid);
    }

    // CHARACTER BOUNDS LISTENERS
    this.characterBounds.on('click', displayVid);

    this.characterBounds.on('touchstart', () => {
      let currSprite = characterManager.getCurrentSprite();
      currSprite.playAnimation(currSprite.states.hover, currSprite.states.middle);
    });

    this.characterBounds.on('mouseover', () => {
      let currSprite = characterManager.getCurrentSprite();
      currSprite.playAnimation(currSprite.states.hover, currSprite.states.middle);
    });

    this.characterBounds.on('mouseout', () => {
      let currSprite = characterManager.getCurrentSprite();
      currSprite.playAnimation(currSprite.states.rHover, currSprite.states.middle);
    });

    this.characterBounds.on('touchend', displayVid);

    // Screen Shield Listeners
    let closeScreenShield = () => {
      let currSprite = characterManager.getCurrentSprite();
      this.video.attr('src', null);
      this.video.css({visibility: "hidden"});
      setTimeout(this.removeScreenShield.bind(this), 100);
      currSprite.playAnimation([currSprite.states.rtouch[0] + 1, currSprite.states.rtouch[1]], currSprite.states.begin,
        () => {
          this.showScreenArea({characterManager});
        })
    }
    this.screenShield.on('click', closeScreenShield);

    this.screenShield.on('touchend', closeScreenShield);
    
    this.closeBtn.on('click', closeScreenShield);
    this.closeBtn.on('touchend', closeScreenShield);

    // TITLE BOX LISTENERS
    // this.titleBox.on('click', () => {
    //   this.characterBounds.visible ? this.characterBounds.visible = false : this.characterBounds.visible = true;
    // });

    let slideFunc = (sprite, end, movesBg) => {
      if (sprite.x <= end) {
        sprite.vx = 0;
        sprite.x = end;
        this.showScreenArea({characterManager: this.characterManager});
        this.characterManager.displayBioBox();
        if (movesBg) {
          backgroundManager.move(0);
        }
      } else {
        if (sprite.vx > -30) {
          sprite.vx += -2;
        } else {
          sprite.vx = -30;
        }
        if (movesBg) {
          backgroundManager.move(sprite.vx);
        }

        setTimeout(() => {
          slideFunc(sprite, end, movesBg)
        }, 0);
      }
    };

    let slideLeftFunc = (sprite, end, movesBg) => {
      if (sprite.x >= end) {
        sprite.vx = 0;
        sprite.x = end;
        this.showScreenArea({characterManager: this.characterManager});
        this.characterManager.displayBioBox();
        if (movesBg) {
          backgroundManager.move(0);
        }
      } else {
        if (sprite.vx < 30) {
          sprite.vx += 2;
        } else {
          sprite.vx = 30;
        }
        if (movesBg) {
          backgroundManager.move(sprite.vx);
        }
        setTimeout(() => {
          slideLeftFunc(sprite, end, movesBg)
        }, 0);
      }
    };

    // NEXT BOX LISTENERS
    let nextFunc = () => {
      this.removeScreenArea();
      this.characterManager.removeBioBox();
      let prevSprite = characterManager.getCurrentSprite();
      let currSprite = characterManager.getNextSprite();

      currSprite.visible = true;
      currSprite.x = 2 * this.spriteWidth + this.spriteWidth/2;

      prevSprite.x = 0;
      prevSprite.visible = true;
      setTimeout(() => {
        slideFunc(prevSprite, -2 * this.spriteWidth - this.spriteWidth/2, true);
        slideFunc(currSprite, 0, false);
      }, 100)

    };

    nextFunc = _.debounce(nextFunc, 500);

    this.next.on('click', nextFunc);

    this.next.on('touchend', nextFunc);

    // Prev BOX LISTENERS
    let prevFunc = () => {
      this.removeScreenArea();
      this.characterManager.removeBioBox();
      let nextSprite = characterManager.getCurrentSprite();
      let currSprite = characterManager.getPrevSprite();

      currSprite.visible = true;
      currSprite.x = -2 * this.spriteWidth - this.spriteWidth/2;

      nextSprite.x = 0;
      nextSprite.visible = true;


      setTimeout(() => {
        slideLeftFunc(nextSprite, 2 * this.spriteWidth + this.spriteWidth/2, true);
        slideLeftFunc(currSprite, 0, false);
      }, 100);
    };

    prevFunc = _.debounce(prevFunc, 500);

    this.prev.on('click', prevFunc);

    this.prev.on('touchend', prevFunc)
  }
}