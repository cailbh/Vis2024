<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable no-unused-vars -->

<template>
  <div :class="VideoClass">

    <!-- <div class="panelHead"></div> -->
    <div class="perVideo" ref="videoDiv">
      <VideoPlay v-show="true" :timeDot="timeDot" @videoTime="getVideoTime" :videoUrl="videoUrl"
        :videoCover="videoCover" :width="videoWidth" :height="videoHeight" :autoplay="true" :controls="true"
        :loop="false" :muted="false" preload="auto" :showPlay="true" :playWidth="96" zoom="fill" />
      <!-- <transition name="showCertenTag"> -->
      <div id="VideoEditPanel" ref="vidEdit" class="" v-show="VideoEditPanelShow">
      </div>
      <!-- </transition> -->
      <!-- <video class="perVideo" ref="video"   :src="url"></video> -->
    </div>

    <div id="rootTopicLine" ref="rootTopicLine">
      <div id="progressBar" ref="progressBar" @click="processBarCli"></div>
    </div>
    <div id="videoScriptUp" ref="videoScriptUp">

      <div id="iconVideo1" @click="playOrPauseClick">
        <img class="iconUpload" :src="videoUrl1">
      </div>
      <!-- <div id="iconVideo2">
        <img class="iconUpload" :src="videoUrl2">
      </div>

      <div id="iconVideo3">
        <img class="iconUpload" :src="videoUrl3">
      </div>

      <div id="iconVideo4">
        <img class="iconUpload" :src="videoUrl4">
      </div> -->

      <div id="timeDurText">
        {{ timeNow }}/{{ overTime }}
      </div>
      <div id="iconVideo5" ref="iconVideo5">
        <img class="iconUpload" :src="videoUrl5">
      </div>
    </div>
    <div id="videoScript" ref="videoScript">
      <!-- <div id="progressBar" ref="progressBar" @click="processBarCli"></div> -->
    </div>
  </div>
</template>

<script>

import * as d3 from 'd3'
import { onMounted, ref } from 'vue';
import domtoimage from 'dom-to-image';
import VideoPlay from '@/components/VideoPlay';
import tools from "@/utils/tools.js";
// import scriptsData from '@/assets/json/case1scriptsData.json'
import scriptsData from '@/assets/json/c1.json'
import tagsData from '@/assets/json/videoBBox.json'
import * as StackBlur from "stackblur-canvas";
import html2canvas from "html2canvas";

import ConJson from "@/assets/json/fin.json";

import { _ } from 'core-js';

//场景元素div
export default {
  props: ["timeDur"],
  components: {
    VideoPlay
  },
  data() {
    return {
      VideoClass: {
        video: true,
        showCertenTag: false,
        unShowCertenTag: false
      },
      scriptsData: scriptsData,
      tagsData: tagsData,
      conceptsData: ConJson,
      scriptsText: [],
      recognizeText: [],
      ketText: [],
      videoWidth: 100,
      videoHeight: 100,
      rootTopicLineWidth: 100,
      rootTopicLineHeight: 100,
      data: '',
      relData: '',
      timeDot: 0,
      videoDur: 672,
      timeNow: '1',
      overTime: '1',
      publicPath: process.env.BASE_URL,
      vertexShader: '',
      videoUrl1: require('@/assets/img/暂停.png'),
      videoUrl2: require('@/assets/img/快进.png'),
      videoUrl3: require('@/assets/img/音量.png'),
      videoUrl4: require('@/assets/img/全屏.png'),
      videoUrl5: require('@/assets/img/addTopic.png'),
      videoUrl: require('@/assets/videos/index.mp4'),
      videoCover: require('@/assets/img/tt.jpg'),
      windowWidth: document.documentElement.clientWidth, //实时屏幕宽度
      windowHeight: document.documentElement.clientHeight, //实时屏幕高度
      colorMap: {},
      margin: { top: 5, right: 5, bottom: 5, left: 5 },
      DivisionDataList: [],
      rootDivisionDataList: [],
      entDivisionDataList: [],
      VideoEditPanelShow: false,
      switchL: [],
      btnEdi: false,
      timeDot: 0,
      editVideoJage: false,
      editVideoSP: [],
      editVideoEP: [],
      tagsList: [],
      certenTag: "",
      tagVideoSize: [640, 360],
      playOrPause: true,
      showGraph: false,
      showExternal: false,
      tagLinearW: '',
      tagLinearH: '',
      importanceColor_linear: "",
      importanceCompute_color: "",
      relevanceScale_linear: "",

      importanceMaxColor: "rgb(143, 142, 184)",
      importanceMinColor: "rgb(206, 199, 209)",
      minDRelevance: 0,
      maxDRelevance: 0,
      relList: [],
      relG: '',
    };
  },
  watch: {
    timeDur(val) {
      this.timeDot = tools.time2seconds(val[0]);
    },
    scriptsText(val) {
      this.drawScript();
    },
    certenTag(val) {
      this.showTagPause(val);
    },
    tagsList(val) {

      this.$bus.$emit("tagsList", val);
      if (this.playOrPause) {
        this.drawTags();
      }
    },
    recognizeText(val) {
      if (val[0] == 1) {
        this.scriptsText = [val[1]]
      }
      else {
        this.addScript(this.timeDot)
      }
    },
    switchL: {
      deep: true,
      handler(val) {
        this.btnEdi = val[3];
        this.drawrootTopicLine()
      }
    },
  },
  methods: {
    playOrPauseClick() {
      const _this = this;
      let svg = d3.select("#VideoEditPanel").select("svg");
      _this.playOrPause = !_this.playOrPause;
      _this.$bus.$emit("playOrPause", _this.playOrPause);

      if (_this.playOrPause == false) {
        _this.VideoClass['showCertenTag'] = true;
        _this.VideoClass['unShowCertenTag'] = false;
      } else {
        svg.selectAll(".videoShowTags").remove();
        _this.VideoClass['showCertenTag'] = false;
        _this.VideoClass['unShowCertenTag'] = true;
      }
    },
    addSvg() {
      const _this = this;
      _this.VideoEditPanelShow = true,
        console.log("yes");
      let width = this.videoWidth; //- margin.left - margin.right;
      let height = this.videoHeight;
      let svg = d3.select("#VideoEditPanel").append("svg")
        .attr("width", width)
        .attr("height", height);
      var defs = svg.append("defs");

      var filter = defs.append("filter")
        .attr("id", "outsideS")
        .attr("x", "-100%").attr("y", "-100%") //
        .attr("width", "300%").attr("height", "300%"); //

      filter.append("feMorphology")
        .attr("in", "SourceGraphic")
        .attr("result", "upperLayer")
        .attr("operator", "dilate")
        .attr("radius", "0 0");

      filter.append("feMorphology")
        .attr("in", "SourceAlpha")
        .attr("result", "enlargedAlpha")
        .attr("operator", "dilate")
        .attr("radius", "0.5 0.5");

      filter.append("feGaussianBlur")
        .attr("in", "enlargedAlpha")
        .attr("result", "bluredAlpha")
        .attr("stdDeviation", "5");

      filter.append("feOffset")
        .attr("in", "bluredAlpha")
        .attr("result", "lowerLayer")
        .attr("dy", "0.1"); //

      // filter.append("feGaussianBlur")
      //   .attr("in", "FillPaint")
      //   .attr("stdDeviation", "10")


      var feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode")
        .attr("in", "lowerLayer");
      feMerge.append("feMergeNode")
        .attr("in", "upperLayer");

      let data = _this.conceptsData;

      let maxDImportance = Math.max.apply(Math, data.map(function (d) { return d['attribute']['importance']; }))
      let minDImportance = Math.min.apply(Math, data.map(function (d) { return d['attribute']['importance']; }))
      let maxDRelevance = Math.max.apply(Math, data.map(function (d) { return d['attribute']['relevance']; }))
      let minDRelevance = Math.min.apply(Math, data.map(function (d) { return d['attribute']['relevance']; }))
      let maxDDuration = Math.max.apply(Math, data.map(function (d) { return tools.time2seconds(d['time'][1]) - tools.time2seconds(d['time'][0]); }))
      let maxTotalDuration = Math.max.apply(Math, data.map(function (d) { return d['totalDuration']; }))
      _this.drawEntityLocation = [];
      _this.minDImportance = minDImportance;
      _this.maxDImportance = maxDImportance;

      _this.minDRelevance = minDRelevance;
      _this.maxDRelevance = maxDRelevance;

      _this.maxDDuration = maxDDuration;
      _this.maxTotalDuration = maxTotalDuration;

      let currentMaxColor = _this.importanceMaxColor;
      let currentMinColor = _this.importanceMinColor;

      _this.importanceColor_linear = d3.scaleLinear().domain([minDImportance, maxDImportance]).range([0, 1]);
      _this.importanceCompute_color = d3.interpolate(currentMinColor, currentMaxColor);
      // _this.relevanceScale_linear = d3.scaleLinear([minDRelevance, maxDRelevance], [20, 50])
      _this.totalDurationScale_linear = d3.scaleLinear().domain([0, maxTotalDuration]).range([20, 60]);


    },
    addNode() {
      const _this = this;
      _this.VideoEditPanelShow = true,
        console.log("yes");
      d3.select("#VideoEditPanel").select("svg").remove();
      let width = this.videoWidth; //- margin.left - margin.right;
      let height = this.videoHeight;
      var svg = d3.select("#VideoEditPanel").append("svg")
        .attr("width", width)
        .attr("height", height);
      svg.append("g")
        .attr("id", "videoTags")
        .attr("width", width)
        .attr("height", height);
      svg.on("mousedown", function (d) {
        _this.editVideoSP = [d.layerX, d.layerY];
        _this.editVideoJage = true;
      }).on("mousemove", function (d) {
        if (_this.editVideoJage) {
          let sP = _this.editVideoSP;
          _this.editVideoEP = [d.layerX, d.layerY];
          let eP = [d.layerX, d.layerY];
          let eX = sP[0] > eP[0] ? sP[0] : eP[0];
          let eY = sP[1] > eP[1] ? sP[1] : eP[1];
          let sX = sP[0] < eP[0] ? sP[0] : eP[0];
          let sY = sP[1] < eP[1] ? sP[1] : eP[1];
          tools.drawRect(svg, sX, sY, Math.abs(eX - sX), Math.abs(eY - sY), 2, "rgba(0,0,0,0)", 2, "rgb(250,250,250)", 1, "videoRect")
        }
        // _this.drawRect(svg,sX , sY, Math.abs(eX-sX), Math.abs(eY - sY), 0,0,"rgba(0,0,0,0)",1, "red", `videoRect`)}
      }).on("mouseup", function (d) {
        _this.editVideoJage = false;

      })
    },
    drawTags() {
      const _this = this;
      let svg = d3.select("#VideoEditPanel").select("svg");

      let tags = _this.tagsList;
      svg.select("#videoTags").remove();
      let width = this.videoWidth; //- margin.left - margin.right;
      let height = this.videoHeight;
      let tagVideoSize = this.tagVideoSize;
      let tagLinearW = d3.scaleLinear([0, tagVideoSize[0]], [0, width]);
      let tagLinearH = d3.scaleLinear([0, tagVideoSize[1]], [0, height]);
      _this.tagLinearW = tagLinearW;
      _this.tagLinearH = tagLinearH;
      // let canvas = _this.getVideoCanvas();
      let g = svg.append("g")
        .attr("id", "videoTags")
        .attr("width", width)
        .attr("height", height);
      for (let i = 0; i < tags.length; i++) {
        let boundingBox = tags[i]['boundingBox'];
        let x = tagLinearW(boundingBox['left']);
        let y = tagLinearH(boundingBox['top']);
        let w = tagLinearW(boundingBox['width']);
        let h = tagLinearH(boundingBox['height']);
        let color = "rgba(0,0,250,1)"
        // console.log(img)
        let tagId = tags[i]['id'];
        let tsgRect = tools.drawRect(g, x, y, w, h, 1, "rgba(0,0,250,0.1)", 1, "rgb(0,0,0)", 1, `videoRect${tagId}`, "videoTagRect");
        tsgRect.on('click', function (d) {
          _this.tagsClick(tags[i]);
        })
          .on("mouseover", function (d) {
            d3.selectAll(".videoTagRect").style("filter", "");
            d3.select(this).style("filter", "url(#outsideS)");
          })
          .on("mouseout", function (d) {
            d3.selectAll(".videoTagRect").style("filter", "");
          })
        // 
        // .style("filter", "drop-shadow(" + color + " " + (30) + "px 0)")
      }

    },
    tagsClick(tag) {
      const _this = this;
      _this.playOrPause = false;
      _this.certenTag = tag;
      _this.$bus.$emit("playOrPause", _this.playOrPause);
      _this.VideoClass['showCertenTag'] = true;
      _this.VideoClass['unShowCertenTag'] = false;

    },
    showTagPause(tag) {
      const _this = this;
      let tagLinearW = _this.tagLinearW;
      let tagLinearH = _this.tagLinearH;

      let boundingBox = tag['boundingBox'];
      let x = tagLinearW(boundingBox['left']);
      let y = tagLinearH(boundingBox['top']);
      let width = tagLinearW(boundingBox['width']);
      let height = tagLinearH(boundingBox['height']);

      let videoWidth = this.videoWidth; //- margin.left - margin.right;
      let videoHeight = this.videoHeight;
      let svg = d3.select("#VideoEditPanel").select("svg");
      svg.selectAll(".videoShowTags").remove();
      let backg = svg.append("g")
        .attr("class", "videoShowTags")
        .attr("width", videoWidth)
        .attr("height", videoHeight);

      let imgG = svg.append("g")
        .attr("class", "videoShowTags")
        .attr("width", videoWidth)
        .attr("height", videoHeight);

      let relG = svg.append("g")
        .attr("class", "videoShowTags")
        .attr("width", videoWidth)
        .attr("height", videoHeight);
      this.relG = relG;

      let entG = svg.append("g")
        .attr("class", "videoShowTags")
        .attr("width", videoWidth)
        .attr("height", videoHeight);

      let canvas = tools.getVideoCanvas("playVideo");
      const data = canvas.getContext("2d").getImageData(x, y, width, height);
      var canvass = document.createElement("canvas");
      canvass.width = width;
      canvass.height = height;
      canvass.getContext("2d").putImageData(data, 0, 0);
      var dataURL = canvass.toDataURL("image/png");  //将图片转成base64格式
      var img = document.createElement('img');
      img.src = dataURL;

      StackBlur.canvasRGB(canvas, 0, 0, videoWidth, videoHeight, 50);
      var dataURLBack = canvas.toDataURL("image/png");  //将图片转成base64格式
      var imgBack = document.createElement('img');
      imgBack.src = dataURLBack;
      backg.append("image")
        .attr("class", "videoShowTags")
        .attr("width", videoWidth)
        .attr("height", videoHeight)
        .attr("xlink:href", dataURLBack);

      let px = videoWidth / 4;
      let nx = videoWidth / 4 * 3;
      let rectMagin = 10;
      tools.drawRect(backg, 0, rectMagin, px - rectMagin, videoHeight - rectMagin * 2, 20, "rgb(172, 232, 229)", 1, "white", 0.5, "tagBackPre", "tagImgBack", '0');
      tools.drawRect(backg, px, rectMagin, nx - px - rectMagin, videoHeight - rectMagin * 2, 20, "rgb(244, 238, 226)", 1, "white", 0.5, "tagBackCur", "tagImgBack", '0');
      tools.drawRect(backg, nx, rectMagin, videoWidth - nx - rectMagin, videoHeight - rectMagin * 2, 20, "rgb(254, 224, 172)", 1, "white", 0.5, "tagBackNex", "tagImgBack", '0');

      let maxW = 300;
      let maxH = 200;

      let trnX = 600;
      let trnY = 100;

      let imgW = maxW > width ? width : maxW;
      let imgH = maxH > height ? height : maxH;

      imgG.attr("transform", function (d) {
        return `translate(${(videoWidth - maxW) - trnX},${videoHeight - maxH - trnY})`;
      })
      tools.drawRect(imgG, -2, -2, maxW + 4, maxH + 4, 10, "rgb(255, 255, 255)", 2, "black", 1, "tagImgBack", "", '0');

      imgG.append("image")
        .attr("width", imgW)
        .attr("height", imgH)
        .attr("xlink:href", dataURL)
        .attr("vector-effect", "non-scaling-stroke")
        .attr("transform", function (d) {
          return `translate(${(maxW - imgW) / 2},${(maxH - imgH) / 2})`;
        })
        .on("click", function (d) { _this.tagsClick(tag) });


      this.drawConcepts(tag, entG);
    },

    drawConcepts(tag, svg) {
      const _this = this;

      this.relList = [];
      let videoWidth = this.videoWidth; //- margin.left - margin.right;
      let videoHeight = this.videoHeight;
      let conceptsData = this.conceptsData;
      let concepts = tag['concepts'];
      let len = concepts.length;

      let sx = videoWidth / 4;
      let sy = videoHeight / 3;

      let px = videoWidth / 4;
      let nx = videoWidth / 4 * 3;

      let minDRelevance = _this.minDRelevance;
      let maxDRelevance = _this.maxDRelevance;
      let maxR = 60;
      let rScale = d3.scaleLinear([minDRelevance, maxDRelevance], [30, maxR]);
      let rtot = 0;
      let conceptsList = [];
      concepts.forEach((element, index) => {
        let curcon = conceptsData.find((d) => { return d['id'] == element; })
        conceptsList.push(curcon);
        let relevanceValue = curcon['attribute']['relevance'];
        let r = rScale(relevanceValue);
        rtot += r;
      })
      let gapX = (nx - px - rtot * 2) / (len + 1);
      let preX = px + (gapX);
      let rootConList = [];
      let fatherMap = [];
      let basicBFReL = [];
      let basicReL = [];
      conceptsList.forEach((element, index) => {
        let curcon = element;
        let relevanceValue = curcon['attribute']['relevance'];

        let basicReL = curcon['basicReL'];
        let father = curcon['father'][0];
        while (father != "-1") {
          let tempCon = conceptsData.find((d) => { return d['id'] == father; })
          father = tempCon['father'][0];
          if ((father == "-1") && (fatherMap.indexOf(tempCon['id']) == -1)) {
            rootConList.push(tempCon);
            fatherMap.push(tempCon['id']);
          }
        }
        let r = rScale(relevanceValue);
        let x = preX + r;
        preX = x + r + gapX
        let y = sy + 10;
        _this.drawConcept(svg, curcon, x, y, r);
        _this.drawConTags(svg, curcon['tags'], px + (x - px) / 2, y + videoHeight / 3);
      });

      _this.drawRootConcept(svg, px, nx, rootConList, concepts);
      _this.drawRels();
    },

    drawRootConcept(svg, px, nx, rootConList, conceptsList) {
      const _this = this;
      let gapX = 50;
      let w = (nx - px - gapX * (rootConList.length + 1)) / (rootConList.length);
      let h = 60;
      let rx = 10;
      let stroke = 'rgb(143, 219, 210)'
      let fill = "rgb(143, 219, 210)";
      let strokeWidth = 1;
      let preX = px;
      let shaColo = 'white'
      rootConList.forEach((d, i) => {
        let cId = d['id'];
        if (conceptsList.indexOf(cId) == -1) {
          let x = px + i * (w + gapX) + gapX;
          let y = 20;
          let rect = tools.drawRect(svg, x, y, w, h, rx, fill, strokeWidth, stroke, 1, `rootCon_${cId}`, 'rootCon', '0');
          // rect.style("filter", "url(#outsideS)");
          rect.style("filter", "drop-shadow(4px 10px 8px rgb(175, 171, 171))");
          let tx = x + w / 2;
          let ty = y + h;
          let txts = d['name'];
          let txtRet = tools.drawTxt(svg, tx, ty, txts, "black", 20, `entRootText_${cId}`);
          txtRet[0].attr("transform", `translate(-${txtRet[1]['width'] / 2},-${txtRet[1]['height'] / 2})`);

          let sonPx = x;
          let sonNx = x + w;
          let sonIdList = d['son'];
          let sonList = [];
          sonIdList.forEach((ele) => {
            let cson = _this.conceptsData.find((c) => { return c['id'] == ele; });
            sonList.push(cson);
          })
          let py = y + h + 10;
          if ((sonList.length > 0)) {
            console.log(sonList)
            _this.drawSonConcept(svg, sonPx, sonNx, sonList, py, conceptsList);
          }
        }

      })
    },
    drawSonConcept(svg, px, nx, sonConList, layY, conceptsList) {
      const _this = this;
      let gapX = 10;
      let w = (nx - px - gapX * (sonConList.length + 1)) / (sonConList.length);
      let h = 30;
      let rx = 10;
      let stroke = 'rgb(183, 229, 220)'
      let fill = "rgb(183, 229, 220)";
      let strokeWidth = 1;
      let preX = px;
      sonConList.forEach((d, i) => {
        let cId = d['id'];
        if (conceptsList.indexOf(cId) == -1) {
          let x = px + i * (w + gapX) + gapX;
          let y = layY;
          let rect = tools.drawRect(svg, x, y, w, h, rx, fill, strokeWidth, stroke, 1, `rootCon_${cId}`, 'rootCon', '0');

          rect.style("filter", "drop-shadow(4px 10px 8px rgb(175, 171, 171))");
          let tx = x + w / 2;
          let ty = y + h;
          let txts = d['name'];
          let txtRet = tools.drawTxt(svg, tx, ty, txts, "black", 20, `entSonText_${cId}`);
          txtRet[0].attr("transform", `translate(-${txtRet[1]['width'] / 2},-${txtRet[1]['height'] / 2})`);


          let sonPx = x;
          let sonNx = x + w;
          let sonIdList = d['son'];
          let sonList = [];
          sonIdList.forEach((ele) => {
            let cson = _this.conceptsData.find((c) => { return c['id'] == ele; });
            sonList.push(cson);
          })
          let py = y + h + 10;
          if ((sonList.length > 0)) {
            _this.drawSonConcept(svg, sonPx, sonNx, sonList, py, conceptsList);
          }
        }
      })

    },
    drawRels() {
      const _this = this;
      let relList = this.relList;
      relList.forEach((e) => {
        _this.drawRel(e[0], e[1]);
      })
    },
    drawRel(s, t) {
      const _this = this;
      let g = this.relG;
      let source = document.getElementById(s);
      let target = document.getElementById(t);
      var sBbox = source.getBBox();
      var tBbox = target.getBBox();
      let sw = sBbox.width;
      let sh = sBbox.height;
      let sx = sBbox.x;
      let sy = sBbox.y + sh / 2;

      let th = tBbox.height;
      let tw = tBbox.width;
      let tx = tBbox.x;
      let ty = tBbox.y + th / 2;

      var defs = g.append("defs");

      let grad = defs.append("linearGradient")
        .attr("id", "grad")
        .attr("x1", "50%").attr("y1", "0%") //
        .attr("x2", "50%").attr("y2", "100%") //
        .attr("width", "300%").attr("height", "300%"); //

      grad.append("stop")
        .attr("offset", "0%")
        .style("stop-color", "rgb(242, 217, 135)")
      grad.append("stop")
        .attr("offset", "100%")
        .style("stop-color", "rgb(242, 217, 135)")
        .style("stop-opacity", "0")

      let points = [[sx, sy], [sx + sw, sy], [tx + tw, ty], [tx, ty]]
      let pgy = tools.drawPolygon(g, points, `rel_${s}_${t}`, 0, "grey", "rgba(128, 128, 128,0.4)")
      pgy.attr("fill", "url(#grad)");
    },
    drawConcept(svg, con, x, y, r) {
      const _this = this;
      let color_linear = _this.importanceColor_linear;
      let compute_color = _this.importanceCompute_color;
      let oData = _this.conceptsData;
      let importanceValue = con['attribute']['importance'];

      let cy = y;
      let totalDuration = _this.totalDuration;
      let circleColor = compute_color(color_linear(importanceValue));
      tools.drawCircle(svg, x, cy, r + 40, circleColor, 0, "white", 1, "entCircle", `entCircle_${con['id']}`);
      tools.drawCircle(svg, x, cy, r, circleColor, 1, "white", 1, "entCircle", `nEntCircle_${con['id']}`);
      let tx = x;
      let ty = y + r + 100;
      let txts = con['name'];
      let txtRet = tools.drawTxt(svg, tx, ty, txts, "black", 20, `entText_${con['id']}`);
      txtRet[0].attr("transform", `translate(-${txtRet[1]['width'] / 2},-${txtRet[1]['height'] / 2})`)
      let serTags = con['serTags'];
      this.drawSerTags(svg, serTags, x, y, r, circleColor, con['id']);
      let father = `rootCon_${con['father'][0]}`;
      _this.relList.push([father, `entCircle_${con['id']}`]);
    },
    drawConTags(svg, tags, x, y) {

      let tagsData = this.tagsData;
      let sevR = 40;
      tags.forEach((ele, ind) => {

        let tag = tagsData.find(function (d) { return d['id'] == ele });
        let type = tag['type'];
        let points = [];
        let stroke = 'rgb(175, 195, 230)';
        let fill = 'rgb(175, 195, 230)';

        let cx = x;
        let cy = y + (sevR + 20) * (ind);

        if (type == 'equation') {
          points = tools.calcTriangle(cx, cy, sevR)
        }
        else if (type == 'text') {
          points = tools.calcRect(cx, cy, sevR)
        }
        else if (type == 'text') {
          points = tools.calcTriangle(cx, cy, sevR)
        }
        else if (type == 'text') {
          points = tools.calcTriangle(cx, cy, sevR)
        }
        let tagsEnt = tools.drawPolygon(svg, points, `conTags${ele}`, 10, stroke, fill);


      })
    },
    drawSerTags(svg, tags, x, y, r, color, id) {
      const _this = this;
      let tagsData = this.tagsData;
      let len = tags.length;

      let sevR = 20;
      let jiantouPath = d3.path();
      let sTheta = -Math.PI / 2 - Math.PI / 6;
      let tTheta = Math.PI + Math.PI / 6;
      let waiColor = "rgb(255,100,100)"
      jiantouPath.arc(x, y, r + 60, sTheta, tTheta)//Math.PI * 2-Math.PI/2-Math.PI/2);

      tools.drawTimeLine(svg, jiantouPath, waiColor, 3, '9,5', 'midArc ', 'midArc ');

      let rlen = r + 60;
      let csx = x + rlen * Math.sin(sTheta + Math.PI / 2);
      let csy = y - rlen * Math.cos(sTheta + Math.PI / 2);

      let ctx = x + rlen * Math.sin(tTheta + Math.PI / 2);
      let cty = y - rlen * Math.cos(tTheta + Math.PI / 2);


      let points = tools.calcTriangle(csx, csy, 8);
      let sEnt = tools.drawPolygon(svg, points, `conSourceIcon${id}`, 1, waiColor, waiColor);
      sEnt.style("transform-origin", "center")
        .style("transform-box", "fill-box")
        .attr("transform", `rotate(${180 * sTheta / Math.PI + 66})`);
      tools.drawCircle(svg, ctx, cty, 7, waiColor, 1, "white", 1, "circle", `conTargetIcon${id}`);

      // let typeArcScale_linear = d3.scaleLinear([0, typeTotalDur], [0, Math.PI * 2]);
      tags.forEach((ele, ind) => {
        let tag = tagsData.find(function (d) { return d['id'] == ele });
        let type = tag['type'];
        let points = [];
        let stroke = color//'rgb(175, 195, 230)';
        let fill = color//'rgb(175, 195, 230)';
        let rlen = r + 62;
        let stepR = Math.PI / 2;
        let curTheta = stepR * (ind + 0.1);
        let cx = x + rlen * Math.sin(curTheta);
        let cy = y - rlen * Math.cos(curTheta);

        // let endAnglet = typeStartR + 1 * typeStepR
        // var dataset = { startAngle: typeStartR, endAngle: endAnglet }; //创建一个弧生成器
        // typeStartR = endAnglet;
        // var arcPath = d3.arc()
        //   .innerRadius(r + 10)
        //   .outerRadius(r + 25);
        // var pathArc = arcPath(dataset);
        // _this.drawArc(svg, x, y - r / 2, pathArc, color, color, 'type f' + data['id'] + " t" + i);


        if (type == 'equation') {
          points = tools.calcTriangle(cx, cy, sevR)
        }
        else if (type == 'text') {
          points = tools.calcRect(cx, cy, sevR)
        }
        else if (type == 'text') {
          points = tools.calcTriangle(cx, cy, sevR)
        }
        else if (type == 'text') {
          points = tools.calcTriangle(cx, cy, sevR)
        }
        // tools.drawCircle(svg, cx, cy, r, fill, 1, stroke, 1, 'circle',' idName')
        let tagsEnt = tools.drawPolygon(svg, points, `conTags${ele}`, 10, stroke, fill);
        tagsEnt
          .style("transform-origin", "center")
          .style("transform-box", "fill-box")
          .attr("transform", `rotate(${180 * curTheta / Math.PI})`)
      })
    },
    getVideoTime(val) {
      const _this = this;
      _this.timeNow = tools.seconds2time(parseInt(val).toFixed(0));
      _this.overTime = tools.seconds2time(_this.videoDur);
      let margin = _this.margin;
      let width = this.$refs.progressBar.offsetWidth;
      let widths = 'calc(100% - 0px)'
      if (_this.btnEdi) {
        width -= 30
        widths = 'calc(100% - 40px)'
      }
      let timeLinear = d3.scaleLinear([0, _this.videoDur], [0, width]);
      let mid = timeLinear(val) / width * 100;
      // _this.timeDot = val;
      _this.addScript(val);
      _this.addTag(val);

      d3.select("#progressBar")
        .attr("style", `background: linear-gradient(90deg, rgba(148, 213, 213,0.5) ${mid}%,rgb(231, 247, 243) ${mid}%) !important;  width: ${widths}`)
      this.$emit("videoTime", val);
    },
    processBarCli(e) {
      const _this = this;
      let x = e.layerX;
      let width = this.$refs.progressBar.offsetWidth;
      if (_this.btnEdi) {
        width -= 30
      }
      let timeLinear = d3.scaleLinear([0, width], [0, _this.videoDur]);
      this.timeDot = parseFloat(timeLinear(x));
    },
    addTag(timeDot) {
      const _this = this;
      let tagsData = _this.tagsData;
      let tags = [];
      for (let t in tagsData) {
        let timeDur = tagsData[t]['timeDur'];
        let sTime = timeDur[0];
        let eTime = timeDur[1];
        if ((timeDot > sTime) && (timeDot < eTime)) {
          tags.push(tagsData[t])
        }
      }
      _this.tagsList = tags;
    },
    addScript(timeDot) {
      const _this = this;
      let scriptsData = _this.scriptsData;
      for (let t in scriptsData) {
        let timeDur = scriptsData[t]['time'];
        let sTime = tools.time2seconds(timeDur[0]);
        let eTime = tools.time2seconds(timeDur[1]);
        if ((timeDot > sTime) && (timeDot < eTime)) {
          _this.scriptsText = scriptsData[t]['text']
        }

      }
    },
    drawScriptUp() {
      let width = this.$refs.videoScriptUp.offsetWidth - margin.left - margin.right;
      let height = this.$refs.videoScriptUp.offsetHeight - margin.top - margin.bottom;
      d3.select("#videoScriptUp").select("svg").remove();
      var svg = d3.select("#videoScriptUp").append("svg")
        .attr("id", "videoScriptUpSvg")
        .attr("width", width)
        .attr("height", height);
    },
    drawScript() {
      const _this = this;
      let txts = _this.scriptsText;
      let margin = _this.margin;
      let ketText = _this.ketText;
      let width = this.$refs.videoScript.offsetWidth - margin.left - margin.right;
      let height = this.$refs.videoScript.offsetHeight - margin.top - margin.bottom + 10;
      d3.select("#videoScript").select("svg").remove();
      var svg = d3.select("#videoScript").append("svg")
        .attr("id", "videoScriptSvg")
        .attr("width", width)
        .attr("height", height);
      let tx = 30;
      let ty = 50;
      let lay = 0;
      for (let i = 0; i < txts.length; i++) {
        let name = txts[i];
        let w = name.length * 10;
        let h = 20;
        let rx = 5;
        let ry = 5;
        // let color = colorMap[ids[i]];
        // _this.drawRect(g, tx, ty, w, h, rx, ry, color, 0.2, color)
        let textColor = "white";
        let stopList = ["of", "the", "and", "be", "two", "x", "y", "z", "a", "to"];
        if ((ketText.indexOf(name) != -1) && (stopList.indexOf(name) == -1)) {
          textColor = "red";
        }
        let svgArea = tools.drawTxt(svg, tx, ty, name, textColor, 34, `txts${i}`)[1];
        tx += svgArea.width + 5;
        if (tx > (width - 30)) {
          let tranx = (width - tx) / 2;
          for (let j = i; j >= lay; j--) {
            d3.select(`#txts${j}`).attr("transform", `translate(${tranx},0)`)
          }
          lay = i;
          tx = 30;
          ty += 30;
        }
        if (i == txts.length - 1) {
          let tranx = (width - tx) / 2;
          for (let j = i; j >= lay; j--) {
            d3.select(`#txts${j}`).attr("transform", `translate(${tranx},0)`)
          }
        }
      }
    },
    drawrootTopicLine() {
      const _this = this;
      const margin = _this.margin;
      const mcolor = _this.mcolor;

      let width = this.$refs.rootTopicLine.offsetWidth //- margin.left - margin.right;
      let height = this.$refs.rootTopicLine.offsetHeight - margin.top - margin.bottom;
      _this.rootTopicLineWidth = width;
      _this.rootTopicLineHeight = height;
      if (_this.btnEdi) {
        width -= 30
        this.$refs.progressBar.style.width = 'calc(100% - 40px)'
        this.$refs.iconVideo5.style.display = 'block'
      }
      else {
        this.$refs.iconVideo5.style.display = 'none'

        this.$refs.progressBar.style.width = 'calc(100% - 10px)'
      }
      d3.select("#rootTopicLine").select("svg").remove();
      var svg = d3.select("#rootTopicLine").append("svg")
        .attr("id", "rootTopicLineSvg")
        .attr("width", width)
        .attr("height", height);

      let groups = svg.append("g").attr("id", "groups").attr("width", width).attr("height", height);
      let tootTopicEntG = groups.append("g").attr("id", "tootTopicEntG").attr("width", width).attr("height", height);
      let rootOriLineG = groups.append("g").attr("id", "rootOriLineG").attr("width", width).attr("height", height);

      rootOriLineG.append("line")
        .attr("x1", 0)
        .attr("y1", height / 2)
        .attr("x2", width)
        .attr("y2", height / 2)
        .attr("stroke", "rgb(200,200,200)")
        .attr("stroke-width", "5px");

      let cxLinear = d3.scaleLinear([0, _this.videoDur], [0, width])

      let data = tools.deepClone(_this.data);
      let DivisionDataList = [];
      let colorIndex = 0;
      for (let i = 0; i < data.length; i++) {
        if (data[i]['layout'] == '0') {
          if (DivisionDataList.length != 0) {
            DivisionDataList[DivisionDataList.length - 1]['nextId'] = data[i]['id'];
            data[i]['preId'] = DivisionDataList[DivisionDataList.length - 1]['id'];
          }
          else { data[i]['preId'] = "-1"; }
          DivisionDataList.push(data[i]);
          let time = tools.time2seconds(data[i]['time'][0]);
          let endTime = tools.time2seconds(data[i]['time'][0]) + data[i]['totalDuration'];
          let cx = cxLinear(time);
          let endx = cxLinear(endTime);
          let color = mcolor[colorIndex];
          // if (data[i]['name'] != 'Test') {
          if (1) {
            color = mcolor[colorIndex];
            colorIndex++;
          }
          else {
            color = "rgb(250, 199, 88)";
          }
          // _this.colorMap[data[i]['id']] = colorIndex % color.length;
          tools.drawRect(rootOriLineG, cx - 1, height / 6, 4, height / 3 * 2, 2, color, 2, "rgb(250,250,250)", 1, "division_" + data[i]["id"], "rootdivisionLine")
          tools.drawRect(tootTopicEntG, cx, height / 6, endx - cx, height / 3 * 2, 1, color, 2, "rgb(250,250,250)", 0.8, "rootEnt_" + data[i]['id'], "rootEnt")
        }
      }
      DivisionDataList[DivisionDataList.length - 1]['nextId'] = "-1";
      _this.rootDivisionDataList = DivisionDataList;
    },
  },
  created() {
    var _this = this;
    this.$bus.$on('graphData', (val) => {
      _this.data = val;
      let ketText = [];
      for (let i = 0; i < _this.data.length; i++) {
        let names = _this.data[i]['name'].split(" ");
        for (let n in names) {
          ketText.push(names[n]);
        }
      }
      _this.ketText = ketText;
      _this.drawrootTopicLine();
    });
    this.$bus.$on('certenTag', (val) => {
      _this.certenTag = val;
    });
    this.$bus.$on('relData', (val) => {
      _this.relData = val;
    });
    this.$nextTick(() => {
      _this.videoWidth = this.$refs.videoDiv.offsetWidth
      _this.videoHeight = this.$refs.videoDiv.offsetHeight
      _this.addSvg();
    })

  },
  mounted() {
    var _this = this;

    this.$bus.$on('switchL', (val) => {
      _this.switchL = val;
    });
    this.$bus.$on('VideoDur', (val) => {
      _this.videoDur = val.toFixed(0);
    });
  }
} 
</script>

<style>
@import './index.css';
</style>
