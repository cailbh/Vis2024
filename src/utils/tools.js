import {createWorker, createScheduler,RecognizeResult,PSM,OEM} from "./tesseract.min.js";

import * as d3 from 'd3'

function calcTriangle(x, y, r) {
  let areas = [[x - r * (Math.sqrt(3)) / 2, y + r / 2], [x + r * (Math.sqrt(3)) / 2, y + r / 2], [x, y - r]];
  return areas;
}
function drawRect(svg, x, y, w, h, rx, fill, strokeWidth, stroke, opacity, idName, className,strokeDasharray = '0') {
  d3.select(`#${idName}`).remove();
  let rect = svg.append("rect")
    .attr("x", x)
    .attr("y", y)
    .attr("width", w)
    .attr("height", h)
    .attr("id", idName)
    .attr("class", className)
    .attr("opacity", opacity)
    .attr("fill", fill)
    .attr("rx", rx)
    .attr("stroke", stroke)
    .attr("stroke-width", strokeWidth)
    .attr("stroke-dasharray", strokeDasharray)
  return rect;
}

function time2seconds(time) {
  let lst = time.split(":");
  let h = lst[0];
  let m = lst[1];
  let s = lst[2];
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
}
function getVideoCanvas(idName) {
  var player = document.getElementById(idName);   //获取video的Dom节点
  player.setAttribute("crossOrigin", "anonymous");  //添加srossOrigin属性，解决跨域问题
  var canvas = document.createElement("canvas");
  canvas.width = player.clientWidth;
  canvas.height = player.clientHeight;
  // canvas = canvas.getContext("2d")
  canvas.getContext("2d").drawImage(player, 0, 0, canvas.width, canvas.height);//截
  return canvas;
}

function time2seconds2(time) {
  let lst = time.split(".");
  let m = lst[0];
  let s = lst[1];
  return parseInt(m) * 60 + parseInt(s);
}
function seconds2time(seconds) {
  let m = Math.floor(seconds / 60);
  let s = seconds % 60;
  let h = Math.floor(m / 60);
  if (m < 10) m = '0' + m;
  if (h < 10) h = '0' + h;
  if (s < 10) s = '0' + s;
  return h + ":" + m + ":" + s;
}

function deepClone(obj) {
    var objClone = JSON.parse(JSON.stringify(obj));
    return objClone;
  }
function getRgbValue(str){
    let reg = /^(rgb|RGB)/;
    if(!reg.test(str)){return;}
    var arr = str.slice(4, str.length-1).split(",")
    return arr;
}
function createWorkers(){
  let worker= createWorker({
    // langPath:"@/assets/data"
    workerPath: '/uti/worker.min.js',
    // corePath: './tesseract-core.wasm.js',
    // langPath: 'D:/Cailibuhong/video2Graph/video2Graph/src/utils/tesseract'
  });
  return worker;
}

export default {
   deepClone:(obj)=>{return deepClone(obj);},
   time2seconds:(time)=>{
    return time2seconds(time);
   },
   time2seconds2:(time)=>{
    return time2seconds2(time);
   },
   seconds2time:(seconds)=>{
    return seconds2time(seconds);
   },
   calcTriangle:(x, y, r)=>{
    return calcTriangle(x, y, r);
   },
   getRgbValue:(str)=>{
    return getRgbValue(str);
   },
   createWorkers:()=>{
    return createWorkers();
   },
   drawRect:(svg, x, y, w, h, rx, fill, strokeWidth, stroke, opacity, idName, className,strokeDasharray = '0')=>{
    return drawRect(svg, x, y, w, h, rx, fill, strokeWidth, stroke, opacity, idName, className,strokeDasharray = '0')},
    getVideoCanvas:(idName)=>{
      return getVideoCanvas(idName);
    }
}