import * as THREE from 'three';
import { categories, type FoodCategory } from '../data/schema';
import { palette } from '../art/planets';

/** Original UV brush marks, painted locally once; these are textures on real lit 3D meshes. */
export function createPlanetMaterials() {
  const ramp=new THREE.DataTexture(new Uint8Array([110,110,110,255,174,174,174,255,220,220,220,255,255,255,255,255]),4,1);
  ramp.minFilter=THREE.NearestFilter;ramp.magFilter=THREE.NearestFilter;ramp.needsUpdate=true;
  const textures:THREE.Texture[]=[ramp];
  const materials={} as Record<FoodCategory,THREE.MeshToonMaterial>;
  for(const category of categories){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle=palette[category];ctx.fillRect(0,0,256,128);
    ctx.strokeStyle='#FFF4D5';ctx.fillStyle='#FFF4D5';ctx.lineWidth=5;ctx.lineCap='round';ctx.globalAlpha=.34;
    if(category==='burger'||category==='breakfast'){
      for(const y of [25,57,92]){ctx.beginPath();ctx.moveTo(-5,y);for(let x=0;x<=270;x+=8)ctx.lineTo(x,y+Math.sin(x*.03+y)*3);ctx.stroke();}
    }else if(category==='side'){
      for(let x=-30;x<280;x+=44){ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+35,40,x-10,80,x+22,128);ctx.stroke();}
    }else if(category==='dessert'){
      for(let i=0;i<15;i++){const x=(i*71)%256,y=(i*37)%128;ctx.beginPath();ctx.ellipse(x,y,8,5,.3,0,Math.PI*2);ctx.fill();}
    }else{
      for(let i=0;i<12;i++){const x=(i*83+20)%256,y=(i*47+10)%128;ctx.beginPath();ctx.arc(x,y,8+(i%3)*3,0,Math.PI*1.6);ctx.stroke();}
    }
    ctx.globalAlpha=.12;
    for(let i=0;i<350;i++){ctx.fillRect((i*73)%256,(i*39)%128,1,1);}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
    materials[category]=new THREE.MeshToonMaterial({map:texture,gradientMap:ramp});
  }
  const outline=new THREE.MeshBasicMaterial({color:'#684F47',side:THREE.BackSide});
  const ring=new THREE.MeshToonMaterial({color:'#F5DDAA',gradientMap:ramp,side:THREE.DoubleSide});
  return {materials,outline,ring,dispose(){Object.values(materials).forEach(m=>m.dispose());outline.dispose();ring.dispose();textures.forEach(t=>t.dispose());}};
}

export function makeLabelTexture(text:string,background='#FFF4D8') {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle=background;ctx.strokeStyle='#A18260';ctx.lineWidth=3;
  ctx.beginPath();ctx.roundRect(4,8,504,80,20);ctx.fill();ctx.stroke();
  ctx.font='600 32px "Microsoft YaHei", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#594638';
  ctx.fillText(text.length>16?text.slice(0,15)+'…':text,256,49,480);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
