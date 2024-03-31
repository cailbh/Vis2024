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
      <div class="chartTooltip toolTip">
        <img id = "chartTooltipImg">
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

      <!-- <div id="timeDurText">
        {{ timeNow }}/{{ overTime }}
      </div> -->
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
import tagsData from '@/assets/json/videoBBox1.json'
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
      videoDur: 0,
      timeNow: '1',
      overTime: '1',
      publicPath: process.env.BASE_URL,
      vertexShader: '',
      videoUrl1: require('@/assets/img/暂停.png'),
      videoUrl2: require('@/assets/img/快进.png'),
      videoUrl3: require('@/assets/img/暂停.png'),
      videoUrl4: require('@/assets/img/全屏.png'),
      videoUrl5: require('@/assets/img/addTopic.png'),
      videoUrl: require('@/assets/videos/case1.mp4'),
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
      // tagVideoSize: [2540, 1440],
      playOrPause: true,
      showGraph: false,
      showExternal: false,
      tagLinearW: '',
      tagLinearH: '',
      importanceColor_linear: "",
      importanceCompute_color: "",
      relevanceScale_linear: "",

      importanceMaxColor: "rgb(19, 115, 178)",
      importanceMinColor: "rgb(136, 182, 211)",
      minDRelevance: 0,
      maxDRelevance: 0,
      nx: 0,
      px: 0,
      fatherSonRelList: [],
      tagsColor: '',
      relList: [],
      relG: '',
      curConList:[],
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
    curConList(val){
      this.$bus.$emit("curCon", val);
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
        _this.videoUrl1 = _this.videoUrl2;
        document.getElementById(`iconVideo1`).style.opacity = 1;
        _this.VideoClass['showCertenTag'] = true;
        _this.VideoClass['unShowCertenTag'] = false;
      } else {
        _this.videoUrl1 = _this.videoUrl3;
        svg.selectAll(".videoShowTags").remove();
        _this.VideoClass['showCertenTag'] = false;
        _this.VideoClass['unShowCertenTag'] = true;
      }
    },
    addSvg() {
      const _this = this;
      _this.VideoEditPanelShow = true;
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
      this.drawProgressBar();

    },
    addNode() {
      const _this = this;
      _this.VideoEditPanelShow = true;
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
      let tagsData = this.tagsData;
      let conceptsData = this.conceptsData;
      let tags = _this.tagsList[0];
      let htags = _this.tagsList[1];
      svg.select("#videoTags").remove();
      svg.selectAll(".videoConTag").remove();
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
        let type = tags[i]['type'];
        let rectColor = _this.tagsColor[type];
        let tagId = tags[i]['id'];
        let tsgRect = tools.drawRect(g, x, y, w, h, 1, rectColor, 10, rectColor, 0, `videoRect${tagId}`, "videoTagRect", "0");
        tsgRect.on('click', function (d) {
          _this.tagsClick(tags[i]);
        })
        .on("mouseover", function (d) {
          d3.selectAll(".videoTagRect").style("filter", "");
          d3.select(this).style("filter", "url(#outsideS)")
            .attr("opacity",0.2);
        // let datas = _this.getCurTagData(tags[i]);
        // let [conceptsList,basicBFReL,basicNEReL] = datas;
        // let bfSx = x;
        // let stepX = 23;
        // let imgUrl = require(`@/assets/img/tagsIcon/tag_text.png`);
        // if(type=="text"){
        //   basicBFReL.forEach((bBf,ind)=>{
        //   let cx = x+stepX*ind;
        //   let cy = y-10;
        //   let tagsEnt = tools.drawImage(g, 20, 20, cx, cy, imgUrl, `videoConTagsB_${tagId}_${ind}`, 'videoConTag');
        // });

        // basicNEReL.forEach((bNe,ind)=>{
        //   let cx = x+w-stepX*ind;
        //   let cy = y-10;
        //   let cId = bNe['id'];
        //   if(tagId == 'text8'){
        //     imgUrl = require(`@/assets/img/tagsIcon/tag_example.png`);
        //   }
        //   let imgid = 0;
        //   if(cId == 8){
        //     imgid =1
        //   }
        //   let tagsEntNe = tools.drawImage(g, 20, 20, cx, cy, imgUrl, `videoConTagsN_${tagId}_${cId}`, 'videoConTag');
        //   tagsEntNe.attr("cursor","pointer")
        //   tagsEntNe.on("mouseover",(d)=>{
        //     let tid = d.target.id.split("_")[2];
        //     let con = conceptsData.find((c)=>{return c['id'] == tid});
        //     var yPosition = d.clientY - 80;
        //     var xPosition = d.clientX + 20;
        //     d3.select("#chartTooltipImg")
        //     .attr("src", require(`@/assets/img/tagImg_${imgid}.png`)) // 替换为你的图片路径
        //     // .attr("width", 300) // 设置图片宽度
        //     // .attr("height", 100)
        //     var chartTooltip = d3
        //     .select(".chartTooltip")
        //     .style("width", "auto")
        //     .style("height", "auto")
        //     .style("left", xPosition + "px")
        //     .style("top", yPosition + "px");

        //   }).on("click",(d)=>{
        //     d3.select(".chartTooltip")
        //     .style("display","none");
        //     let tid = d.target.id.split("_")[2];
        //     let con = conceptsData.find((c)=>{return c['id'] == tid})
        //     let targetTime = con['time'];
        //     let targetTag = tagsData.find((tg)=>{return tg['id'] == 'text54'})
        //     _this.timeDot = tools.time2seconds(targetTime[0]);
        //     // tools.sleep(1000).then(() => {
        //     // _this.tagsClick(targetTag);
        //     // })
        //     console.log(d,tid,con,);
        //   })
        // })}
        // let tagsList = [];
        // conceptsList.forEach((ccp,ind)=>{
        //   tagsList = Array.from(new Set([...tagsList,...ccp['serTags'],...ccp['tags']]));
        // })
        // let idx = 0;
        // tagsList.forEach((tg,ind)=>{
        //   let tempTag =tagsData.find(function(d){return d['id'] == tg;});
        //   let type = tempTag['type'];
        //   if (1){
        //   let cx = x+stepX*idx;
        //     idx+=1;
        //   let cy = y+h+10;
        //   let imgUrl = require(`@/assets/img/tagsIcon/tag_${type}.png`);
        //   let tagsEnt = tools.drawImage(svg, 20, 20, cx, cy, imgUrl, `videoRelTags_${tagId}_${tempTag['id']}`, 'videoConTag');}
        // })
        })
        .on("mouseout", function (d) {
          d3.selectAll(".videoTagRect").style("filter", "");
        })
        // .style("filter", "drop-shadow(" + color + " " + (30) + "px 0)")
        // let conList = [...tags[i]['concepts'],...tags[i]['serveConcepts']]
        // console.log(conList);
        // conList.forEach((curCon,cIndex)=>{
        //   console.log(curCon);
        // // let imgUrl = require(`@/assets/img/tagsIcon/tag_${type}.png`);

        // // let tagsEnt = tools.drawImage(svg, 30, 30, cx, cy, imgUrl, `videoConTags_${cId}_${ele}`, 'videoConTags');
        // })
        htags.forEach((ht)=>{
          let tagId = ht['id'];
          // d3.selectAll(".videoTagRect").style("filter", "");
          d3.select(`#videoRect${tagId}`)
            .attr("opacity",0.2)
          // .style("filter", "drop-shadow(4px 10px 8px rgb(175, 171, 171))")
          .style("filter", "url(#outsideS)");
        })
        
      }

    },
    tagsClick(tag) {
      const _this = this;
      _this.playOrPause = false;
      _this.videoUrl1 = _this.videoUrl2;
      _this.certenTag = tag;
      document.getElementById(`iconVideo1`).style.opacity = 1;
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
        .attr("xlink:href", dataURLBack)
        .attr("opacity",0)
        .transition()  // 开始执行动画
        .duration(1000)
        .attr("opacity",1)
// -------------------------------------------------------
      let maxW = 320;
      let maxH = 180;

      let trnX = 630;
      let trnY = 80;

      let imgW = maxW > width ? width : maxW;
      let imgH = maxH > height ? height : maxH;

      imgG
      .attr("transform", function (d) {
        return `translate(${x},${y})`;
      })
      .transition()  // 开始执行动画
      .duration(1000)
      .attr("transform", function (d) {
        return `translate(${(videoWidth - maxW) - trnX},${videoHeight - maxH - trnY})`;
      })
      let imgRect = tools.drawRect(imgG, -2, -2, maxW + 4, maxH + 4, 10, "rgb(255, 255, 255)", 2, "white", 0, "tagImgBack", "", '0');
      tools.transitionSvg(1000,imgRect, -2, -2, maxW + 4, maxH + 4, "rgb(255, 255, 255)", "black", 1, "rect");

      imgG.append("image")
        .attr("width", width)
        .attr("height", height) 
        .attr("xlink:href", dataURL)
        .attr("vector-effect", "non-scaling-stroke")  
        .attr("transform", function (d) {
          return `translate(${(maxW - imgW) / 2},${(maxH - imgH) / 2})`;
        })     
        .on("click", function (d) { _this.tagsClick(tag) })
        .transition()  // 开始执行动画
        .duration(1000)
        .attr("width", imgW)
        .attr("height", imgH)  
// -------------------------------------------------------


      let px = videoWidth / 3;
      let nx = videoWidth / 3 * 2;
      _this.px = px;
      _this.nx = nx;
      let rectTop = 230;
      let rectMagin = 10;
      let amiTime = 2000;
      let rectB1 = tools.drawRect(backg,  0, rectTop, px - rectMagin, 0, 20, tools.rgb2rgba("rgb(237, 244, 201)"), 1, "white", 0.5, "tagBackPre", "tagImgBack", '0');
      let rectB2 = tools.drawRect(backg, px, rectTop, nx - px - rectMagin, 0, 20, tools.rgb2rgba("rgb(232, 245, 244)"), 1, "white", 0.5, "tagBackCur", "tagImgBack", '0');
      let rectB3 = tools.drawRect(backg, nx, rectTop, videoWidth - nx - rectMagin, 0, 20, tools.rgb2rgba("rgb(252, 247, 231)"), 1, "white", 0.5, "tagBackNex", "tagImgBack", '0');
      
      tools.transitionSvg(amiTime,rectB1, 0, rectTop, px - rectMagin, videoHeight - rectMagin -rectTop, tools.rgb2rgba("rgb(237, 244, 201)"), "white", 0.5, "rect");
      tools.transitionSvg(amiTime,rectB2, px, rectTop, nx - px - rectMagin, videoHeight - rectMagin -rectTop, tools.rgb2rgba("rgb(232, 245, 244)"), "white", 0.5, "rect");
      tools.transitionSvg(amiTime,rectB3, nx, rectTop, videoWidth - nx - rectMagin, videoHeight - rectMagin-rectTop, tools.rgb2rgba("rgb(252, 247, 231)"), "white", 0.5, "rect");
      
      let imgRect1 = tools.drawRect(backg, -2, -2, 250, 520, 10, "rgb(255, 255, 255)", 2, "white", 0, "tagBackTlB", "", '0');
      tools.transitionSvg(1000,imgRect1, px/2-255, 640, 520, 330, "rgb(255, 255, 255)", "black", 1, "rect");

      let imgUrltl = require(`@/assets/img/tl.svg`);
        let tagsEnttl = tools.drawImage(backg, 500, 500, 0, 0, imgUrltl, `tagBackTl`, 'tagBackTl');
          tagsEnttl.transition()  // 开始执行动画
          .duration(1000)     // 设置动画持续时间
          .attr('transform', `translate(${px/2}, 800)`)   // 移动位置
      let imgUrltl1 = require(`@/assets/img/tagsIcon/tag_text.png`);
        let tagsEnttl1 = tools.drawImage(backg, 35, 35, 0, 0, imgUrltl1, `tagBackTl1`, 'tagBackTl1');
          tagsEnttl1.transition()  // 开始执行动画
          .duration(1000)     // 设置动画持续时间
          .attr('transform', `translate(${px/2+139}, 807)`)   // 移动位置

      let imgUrltl2 = require(`@/assets/img/tagsIcon/tag_figure.png`);
        let tagsEnttl2 = tools.drawImage(backg, 35, 35, 0, 0, imgUrltl2, `tagBackTl2`, 'tagBackTl2');
          tagsEnttl2.transition()  // 开始执行动画
          .duration(1000)     // 设置动画持续时间
          .attr('transform', `translate(${px/2+221}, 807)`)   // 移动位置
      let imgUrltl3 = require(`@/assets/img/tagsIcon/tag_equation.png`);
        let tagsEnttl3 = tools.drawImage(backg, 35, 35, 0, 0, imgUrltl3, `tagBackTl3`, 'tagBackTl3');
          tagsEnttl3.transition()  // 开始执行动画
          .duration(1000)     // 设置动画持续时间
          .attr('transform', `translate(${px/2+139}, 895)`)   // 移动位置

      let imgUrltl4 = require(`@/assets/img/tagsIcon/tag_example.png`);
        let tagsEnttl4 = tools.drawImage(backg, 35, 35, 0, 0, imgUrltl4, `tagBackTl4`, 'tagBackTl4');
          tagsEnttl4.transition()  // 开始执行动画
          .duration(1000)     // 设置动画持续时间
          .attr('transform', `translate(${px/2+221}, 895)`)   // 移动位置
      // rectB1.transition()  // 开始执行动画
      //   .duration(1000)     // 设置动画持续时间
      //   .attr('transform', 'translate(200, 100)')   // 移动位置
      //   .attr("fill", "blue")   // 改变颜色
      //   .attr('stroke-width', '0.5px')  // 添加边框
      //   .attr('stroke', 'black')    // 边框颜色
      
      let tx1 = px / 2;
      let tx2 = px + (nx - px)/2;
      let tx3 = nx + (videoWidth - nx)/2;
      let ty = videoHeight - 20;

      // let txtRet1 = tools.drawTxts(svg, tx1, ty, "Preparation", "black", 20, `tagBackTxt1`);
      // let txtRet2 = tools.drawTxt(svg, tx2, ty, "Demonstration", "black", 20, `tagBackTxt2`);
      let txtRet1 = tools.drawTxts(backg, tx1, ty, 1, "Preparation", "black", 20, `tagBackTxt1`);
      let txtRet2 = tools.drawTxts(backg, tx2, ty, 1, "Demonstration", "black", 20, `tagBackTxt2`);
      let txtRet3 = tools.drawTxts(backg, tx3, ty, 1, "Application", "black", 20, `tagBackTxt3`);
      tools.sleep(2000).then(() => {
        this.drawConcepts(tag, entG);
      })
    },

    getCurTagData(tag){
      let concepts = tag['concepts'];
      let conceptsData = this.conceptsData;
      let conceptsList = [];
      let basicBFIdReL = [];
      let basicNEIdReL = [];
      let basicBFReL = [];
      let basicNEReL = [];
      concepts.forEach((element, index) => {
        let curcon = conceptsData.find((d) => { return d['id'] == element; })
        conceptsList.push(curcon);
        let relevanceValue = curcon['attribute']['relevance'];
        let curId = curcon['id'];
        let basicRelConIds = curcon['basicRel'];
        let similarityRelConIds = curcon['similarityRel'];
        let allRel = [...basicRelConIds, ...similarityRelConIds];
        allRel.forEach((bE) => {
          let relCon = conceptsData.find((d) => { return d['id'] == bE; })

          if ((parseInt(bE) < parseInt(curId)) && (basicBFIdReL.indexOf(bE) == -1)) {
            basicBFIdReL.push(bE);
            basicBFReL.push(relCon);
          }
          else if ((parseInt(bE) > parseInt(curId)) && (basicNEIdReL.indexOf(bE) == -1)) {
            basicNEIdReL.push(bE);
            basicNEReL.push(relCon);
          }
        })
      })
      return [conceptsList,basicBFReL,basicNEReL]
    },
    drawConcepts(tag, svg) {
      const _this = this;

      this.fatherSonRelList = [];
      this.relList = [];

      let videoWidth = this.videoWidth; //- margin.left - margin.right;
      let videoHeight = this.videoHeight;
      let conceptsData = this.conceptsData;
      let concepts = tag['concepts'];
      let len = concepts.length;

      let sx = videoWidth / 3;
      let sy = videoHeight / 2-60;

      let px = videoWidth / 3;
      let nx = videoWidth / 3 * 2;

      let minDRelevance = _this.minDRelevance;
      let maxDRelevance = _this.maxDRelevance;
      let maxR = 25;
      let rScale = d3.scaleLinear([minDRelevance, maxDRelevance], [10, maxR]);
      let rtot = 0;
      let rtotP = 0;
      let rtotN = 0;
      let conceptsList = [];
      let basicBFIdReL = [];
      let basicNEIdReL = [];
      let basicBFReL = [];
      let basicNEReL = [];
      concepts.forEach((element, index) => {
        let curcon = conceptsData.find((d) => { return d['id'] == element; })
        conceptsList.push(curcon);
        let relevanceValue = curcon['attribute']['relevance'];
        let r = rScale(relevanceValue);
        rtot += r;
        let curId = curcon['id'];
        let basicRelConIds = curcon['basicRel'];
        let similarityRelConIds = curcon['similarityRel'];
        let allRel = [...basicRelConIds, ...similarityRelConIds];
        basicRelConIds.forEach((br) => {
          if (parseInt(br) < parseInt(curId)) {
            _this.relList.push([br, curId, 0]);
          }
          else {
            _this.relList.push([curId, br, 0]);
          }
        })
        similarityRelConIds.forEach((sr) => {
          if (parseInt(sr) < parseInt(curId)) {
            _this.relList.push([sr, curId, 1]);
          }
          else {
            _this.relList.push([curId, sr, 1]);
          }
        })
        allRel.forEach((bE) => {
          let relCon = conceptsData.find((d) => { return d['id'] == bE; })

          if ((parseInt(bE) < parseInt(curId)) && (basicBFIdReL.indexOf(bE) == -1)) {
            basicBFIdReL.push(bE);
            basicBFReL.push(relCon);
            // 
            let NrelevanceValue = relCon['attribute']['relevance'];
            let rN = rScale(NrelevanceValue);
            rtotN += rN;
            // _this.relList.push([])//关系
          }
          else if ((parseInt(bE) > parseInt(curId)) && (basicNEIdReL.indexOf(bE) == -1)) {
            basicNEIdReL.push(bE);
            basicNEReL.push(relCon);
            // _this.relList.push([curId,bE,0]);
            let PrelevanceValue = relCon['attribute']['relevance'];
            let rP = rScale(PrelevanceValue);
            rtotP += rP;
          }
        })
        similarityRelConIds.forEach((sR) => {

        })
      })

      // ----------------------------------------------------------------------------------------------
      let gapX = (nx - px - rtot * 2) / (len + 1);
      let preX = px + (gapX);
      let rootConList = [];
      let fatherMap = [];
      conceptsList.forEach((element, index) => {
        let curcon = element;
        let relevanceValue = curcon['attribute']['relevance'];
        let father = curcon['father'][0];
        if ((father == "-1") && (fatherMap.indexOf(curcon['id']) == -1)) {
          rootConList.push(curcon);
          fatherMap.push(curcon['id']);
        }
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
        _this.drawConcept(svg, curcon, x, y, r,1);
        // _this.drawConTags(svg, curcon, px + (x - px) / 2, y + videoHeight / 3);
      });

      // ----------------------------------------------------------------------------------------------      
      // ----------------------------------------------------------------------------------------------

      let Plen = basicNEReL.length;
      let gapPX = (videoWidth - nx - rtotP * 2) / (Plen + 1);
      let prePX = nx + (gapPX);
      let rootPConList = [];
      basicNEReL.forEach((element, index) => {
        let curcon = element;
        let relevanceValue = curcon['attribute']['relevance'];
        let father = curcon['father'][0];
        
        if ((father == "-1") && (fatherMap.indexOf(curcon['id']) == -1)) {
          rootPConList.push(curcon);
          fatherMap.push(curcon['id']);
        }
        while (father != "-1") {
          let tempCon = conceptsData.find((d) => { return d['id'] == father; })
          father = tempCon['father'][0];
          if ((father == "-1") && (fatherMap.indexOf(tempCon['id']) == -1)) {
            rootPConList.push(tempCon);
            fatherMap.push(tempCon['id']);
          }
        }
        let r = rScale(relevanceValue);
        let x = prePX + r;
        prePX = x + r + gapPX
        let y = sy + 10;
        _this.drawConcept(svg, curcon, x, y, r,0);
        // _this.drawConTags(svg, curcon, nx + (x - nx), y + videoHeight / 3);
      });


      // ---------------------------------------------------------------------------------------------- 
      // ----------------------------------------------------------------------------------------------

      let Nlen = basicBFReL.length;
      let gapNX = (px - rtotN * 2) / (Nlen + 1);
      let preNX = 0 + (gapNX);
      let rootNConList = [];
      basicBFReL.forEach((element, index) => {
        let curcon = element;
        let relevanceValue = curcon['attribute']['relevance'];
        let father = curcon['father'][0];
        if ((father == "-1") && (fatherMap.indexOf(curcon['id']) == -1)) {
          rootNConList.push(curcon);
          fatherMap.push(curcon['id']);
        }
        while (father != "-1") {
          let tempCon = conceptsData.find((d) => { return d['id'] == father; })
          father = tempCon['father'][0];
          if ((father == "-1") && (fatherMap.indexOf(tempCon['id']) == -1)) {
            rootNConList.push(tempCon);
            fatherMap.push(tempCon['id']);
          }
        }
        let r = rScale(relevanceValue);
        let x = preNX + r;
        preNX = x + r + gapNX
        let y = sy + 10;
        _this.drawConcept(svg, curcon, x, y, r,0);
        // _this.drawConTags(svg, curcon, 0 + (x), y + videoHeight / 3);
      });
      this.curConList = concepts;
      let allCon = [...concepts, ...basicBFIdReL, ...basicNEIdReL]
      _this.drawRootConcept(svg, px, nx, rootConList, allCon);
      _this.drawRootConcept(svg, nx, videoWidth, rootPConList, allCon);
      _this.drawRootConcept(svg, 0, px, rootNConList, allCon);
      _this.drawFatherSonRels();

      // ----------------------------------------------------------------------------------------------
    },

    drawRootConcept(svg, px, nx, rootConList, conceptsList) {
      const _this = this;
      let gapX = 20;
      let w = (nx - px - gapX * (rootConList.length + 1)) / (rootConList.length);
      let h = 40;
      let rx = 10;
      let stroke = 'rgb(10, 105, 173)'
      let fill = "rgb(10, 105, 173)";
      let strokeWidth = 1;
      let preX = px;
      let shaColo = 'white';
      let timeDur = 0;
      rootConList.forEach((d, i) => {
        timeDur += d['totalDuration'];
      })
      let widthLinear = d3.scaleLinear([0, timeDur], [0, (nx - px) - gapX * (rootConList.length + 1)]);

      rootConList.forEach((d, i) => {
        let cId = d['id'];
        let curTimeDur = d['totalDuration'];
        let cW = widthLinear(curTimeDur);
        let sonIdList = d['son'];
        // if (conceptsList.indexOf(cId) == -1) {&&
        // if(tools.hasDuplicates(conceptsList,sonIdList)){
        let x = px + gapX;
        px += cW + gapX;
        let y = 240;
        let rect = tools.drawRect(svg, x, y, cW, h, rx, fill, strokeWidth, stroke, 1, `rootCon_${cId}`, 'rootCon', '0');
        // rect.style("filter", "url(#outsideS)");
        rect.style("filter", "drop-shadow(4px 10px 8px rgb(175, 171, 171))");
        let tx = x + cW / 2;
        let ty = y + h;
        let txts = d['name'];
        let txtsP =txts.split(" ")
          if(txtsP.length>2){
            txts = `${txtsP[0]} ${txtsP[1]} ...`;
          }
        let txtRet = tools.drawTxt(svg, tx, ty, txts, "black", 16, `entRootText_${cId}`);
        txtRet[0].attr("transform", `translate(-${txtRet[1]['width'] / 2},-${txtRet[1]['height']})`);

        let sonPx = x;
        let sonNx = x + cW;
        let sonList = [];
        sonIdList.forEach((ele) => {
          let cson = _this.conceptsData.find((c) => { return c['id'] == ele; });
          sonList.push(cson);
        })
        let py = y + h + 10;
        if ((sonList.length > 0)) {
          _this.drawSonConcept(svg, sonPx, sonNx, curTimeDur, sonList, py, conceptsList);
        }
        // }

      })
    },
    drawSonConcept(svg, px, nx, timeDur, sonConList, layY, conceptsList) {
      const _this = this;
      let gapX = 10;
      let w = (nx - px - gapX * (sonConList.length + 1)) / (sonConList.length);
      let h = 30;
      let rx = 10;
      let stroke = 'rgb(171, 208, 216)'
      let fill = "rgb(171, 208, 216)";
      let strokeWidth = 1;
      let preX = px;
      let widthLinear = d3.scaleLinear([0, timeDur], [0, (nx - px) - gapX * (sonConList.length + 1)]);
      sonConList.forEach((d, i) => {
        let cId = d['id'];

        let curTimeDur = d['totalDuration'];
        let sonIdList = d['son'];
        console.log("f",cId,"s",sonIdList,conceptsList,tools.hasDuplicates(conceptsList, sonIdList))
        if ((tools.hasDuplicates(conceptsList, sonIdList))) {
          let cW = widthLinear(curTimeDur);
          let x = px + gapX;
          px += cW + gapX;
          let y = layY;
          let rect = tools.drawRect(svg, x, y, cW, h, rx, fill, strokeWidth, stroke, 1, `rootCon_${cId}`, 'rootCon', '0');

          rect.style("filter", "drop-shadow(4px 10px 8px rgb(175, 171, 171))");
          let tx = x + cW / 2;
          let ty = y + h / 2+6;
          let txts = d['name'];
          let txtsP =txts.split(" ")
          if(txtsP.length>2){
            txts = `${txtsP[0]} ${txtsP[1]} ...`;
          }
          tools.drawTxts(svg, tx, ty, w * 0.8, txts, "black", 14, `entText_${cId}`);
          // let txtRet = tools.drawTxt(svg, tx, ty, txts, "black", 20, `entSonText_${cId}`);
          // txtRet[0].attr("transform", `translate(-${txtRet[1]['width'] / 2},-${txtRet[1]['height'] / 2})`);


          let sonPx = x;
          let sonNx = x + cW;
          let sonList = [];
          sonIdList.forEach((ele) => {
            let cson = _this.conceptsData.find((c) => { return c['id'] == ele; });
            sonList.push(cson);
          })
          let py = y + h + 10;
          if ((sonList.length > 0)) {
            _this.drawSonConcept(svg, sonPx, sonNx, curTimeDur, sonList, py, conceptsList);
          }
        }
      })

    },
    drawFatherSonRels() {
      const _this = this;
      let fatherSonRelList = this.fatherSonRelList;
      let relList = this.relList;

      relList.forEach((r) => {
        _this.drawRel(...r);
      })
      fatherSonRelList.forEach((e) => {
        _this.drawFatherSonRel(...e);
      })
    },
    drawRel(s, t, type) {
      const _this = this;
      let g = this.relG;
      let source = document.getElementById(`entText_${s}`);//(`entCircle_${s}`)
      let target = document.getElementById(`entText_${t}`);
      const path = d3.path();

      let conceptsData = this.conceptsData;
      let sCon = conceptsData.find((d) => { return d['id'] == s; })
      let tCon = conceptsData.find((d) => { return d['id'] == t; });

      var sBbox = source.getBBox();
      var tBbox = target.getBBox();
      let sw = sBbox.width;
      let sh = sBbox.height;
      // let sx = sBbox.x;
      let sy = sBbox.y + sh + 20;
      let sx = sBbox.x + sw / 2;

      let th = tBbox.height;
      let tw = tBbox.width;
      let tx = tBbox.x + tw / 2;
      let ty = tBbox.y + th + 20;
      let cny = (sy + ty) / 2;

      let lineColor = 'rgb(107, 178, 168)';
      if (type == 0) {
        let hScale_linear = d3.scaleLinear([0, _this.videoWidth / 3], [10, 55])
        cny += hScale_linear(tx - sx);
        let midX1 = sx + (tx - sx) / 4;
        let midX2 = tx - (tx - sx) / 4;
        path.moveTo(sx, sy);
        path.bezierCurveTo(midX1, cny, midX2, cny, tx, ty);
        tools.drawTimeLine(g, path, lineColor, 2, '', `BarelLine_${s}_${t}`, 'relLine');
      }
      else if (type == 1) {
        let hScale_linear = d3.scaleLinear([0, Math.pow(_this.videoWidth / 3,3)], [0, 45])
        cny += hScale_linear(Math.pow((tx - sx),3));
        let midX1 = sx + (tx - sx) / 4;
        let midX2 = tx - (tx - sx) / 4;
        if(t == '17'){cny+=10}
        path.moveTo(sx, sy);
        path.lineTo(sx, cny);
        // path.arcTo(sx + 10, cny + 10, sx + 20, cny + 20, 1);
        path.lineTo(tx, cny);
        path.lineTo(tx, ty);
        // path.bezierCurveTo(midX1, cny, midX2, cny, tx, ty);
        tools.drawTimeLine(g, path, lineColor, 2, '', `SirelLine_${s}_${t}`, 'relLine');
      }
    },
    drawFatherSonRel(s, t,type) {
      const _this = this;
      let g = this.relG;
      let source = document.getElementById(s);
      let target = document.getElementById(t);
      console.log(s,t,source,target)

      let conceptsData = this.conceptsData;
      let sCon = conceptsData.find((d) => { return d['id'] == s.split("_")[1]; })
      let tCon = conceptsData.find((d) => { return d['id'] == t.split("_")[1]; });

      var sBbox = source.getBBox();
      var tBbox = target.getBBox();
      // let sw = sBbox.width;
      let sh = sBbox.height;
      // let sx = sBbox.x;
      let sy = sBbox.y + sh - 10;

      let th = tBbox.height;
      let tw = tBbox.width;
      let tx = tBbox.x;
      let ty = tBbox.y + th / 2;

      let StimeDur = sCon['totalDuration'];
      let TtimeDur = tCon['totalDuration'];
      let StimeStart = sCon['time'][0];
      let TtimeStart = tCon['time'][0];
      let startTime = tools.time2seconds(TtimeStart) - tools.time2seconds(StimeStart)
      let widthLinear = d3.scaleLinear([0, StimeDur], [0, sBbox.width]);
      let sw = widthLinear(TtimeDur);
      let sx = sBbox.x + widthLinear(startTime);
      var defs = g.append("defs");

      let grad = defs.append("linearGradient")
        .attr("id", "grad")
        .attr("x1", "50%").attr("y1", "0%") //
        .attr("x2", "50%").attr("y2", "100%") //
        .attr("width", "300%").attr("height", "300%"); //

      grad.append("stop")
        .attr("offset", "0%")
        .style("stop-color", "rgb(150, 150, 150)")
      grad.append("stop")
        .attr("offset", "80%")
        .style("stop-color", "rgb(150, 150, 150)")
        .style("stop-opacity", "0.1")
      grad.append("stop")
        .attr("offset", "100%")
        .style("stop-color", "rgb(150, 150, 150)")
        .style("stop-opacity", "0")

      let gradL = defs.append("linearGradient")
        .attr("id", "gradL")
        .attr("x1", "50%").attr("y1", "0%") //
        .attr("x2", "50%").attr("y2", "100%") //
        .attr("width", "300%").attr("height", "300%"); //

      gradL.append("stop")
        .attr("offset", "0%")
        .style("stop-color", "rgb(160, 160, 160)")
        .style("stop-opacity", "0.5")
      gradL.append("stop")
        .attr("offset", "50%")
        .style("stop-color", "rgb(160, 160, 160)")
        .style("stop-opacity", "0.1")
      gradL.append("stop")
        .attr("offset", "100%")
        .style("stop-color", "rgb(160, 160, 160)")
        .style("stop-opacity", "0")

      let points = [[sx, sy], [sx + sw, sy], [tx + tw, ty], [tx, ty]]
      let pgy = tools.drawPolygon(g, points, `rel_${s}_${t}`, 0, "grey", "rgba(128, 128, 128,0.4)")
      if(type==1){
        pgy.attr("fill", "url(#grad)");
      }
      else{
        pgy.attr("fill", "url(#gradL)");
      }
    },
    drawConcept(g, con, x, y, r,ifCur) {
      const _this = this;
      let color_linear = _this.importanceColor_linear;
      let compute_color = _this.importanceCompute_color;
      let oData = _this.conceptsData;
      let importanceValue = con['attribute']['importance'];
      let height = _this.videoHeight;
      let cy = y;

      let px = this.px
      let nx = this.px
      let totalDuration = _this.totalDuration;
      let circleColor = compute_color(color_linear(importanceValue));
      let icong = g.append("g");
      let svg = g.append("g")
      
      let tx = x;
      let ty = y + r * 3 + 30;
      let txts = con['name'];
      // let txtRet = tools.drawTxt(svg, tx, ty, txts, "black", 20, `entText_${con['id']}`);
      tools.drawTxts(svg, tx, ty, r, txts, "black", 14, `entText_${con['id']}`);

      if(txts == 'Example'){
        let imgUrl = require(`@/assets/img/tagsIcon/tag_example.png`);
        // tools.drawCircle(svg, cx, cy, r, fill, 1, stroke, 1, 'circle',' idName')
        // let tagsEnt = tools.drawPolygon(svg, points, `conTags${ele}`, 0, stroke, fill);
        let tagsEnt = tools.drawImage(svg, 50, 50, x, cy, imgUrl, `entExample_${con['id']}`, 'entCircle');
        return
        // d3.selectAll('.entCircle').remove()
        // d3.selectAll('.conIncon').remove()
        // d3.selectAll('.relCon').remove()
      }
      // txtRet[0].attr("transform", `translate(-${txtRet[1]['width'] / 2},-${txtRet[1]['height'] / 2})`)
      this.drawSerTags(icong, con, x, y, r, circleColor);
      let fatherId = con['father'][0];
      if (fatherId != "-1") {
        let father = `rootCon_${fatherId}`;
        _this.fatherSonRelList.push([father, `entCircle_${con['id']}`,ifCur]);
      }
      else {
        _this.fatherSonRelList.push([`rootCon_${con['id']}`, `entCircle_${con['id']}`,ifCur]);

      }

      tools.drawCircle(svg, x, cy, r + 15, "rgb(224, 250, 237)", 1, "white", 1, "entCircle", `entCircle_${con['id']}`);
      this.drawConRelConEnt(svg, con, x, y, r + 7);
      let entCircle = tools.drawCircle(svg, x, cy, r, circleColor, 1, "white", 0, "entCircle", `nEntCircle_${con['id']}`);
      if(ifCur){
        _this.drawConTags(g, con, px + 100, y + 250, height / 2 - 250);
      }
      entCircle.on("mouseover", (d) => {
        _this.drawConTags(g, con, px + 100, y + 250, height / 2 - 250);
      }).on("click", (d) => {
            _this.playOrPauseClick();
            let tid = d.target.id.split("_")[1];
            let con = oData.find((c)=>{return c['id'] == tid})
            let targetTime = con['time'];
            let targetTag = tagsData.find((tg)=>{return tg['id'] == 'text33'})
            _this.timeDot = tools.time2seconds(targetTime[0]);
            tools.sleep(1000).then(() => {
            _this.tagsClick(targetTag);
            })
      })
    },
    drawConRelConEnt(svg, con, x, y, r, color) {
      const _this = this;
      let conceptsData = this.conceptsData;
      let rel = [...con['basicRel'], ...con['similarityRel']];

      let timeLinear = d3.scaleLinear([0, _this.videoDur], [0, Math.PI * 2]);
      let color_linear = _this.importanceColor_linear;
      let compute_color = d3.interpolate("rgb(146, 211, 203)", "rgb(107, 178, 168)");
      let outsideR = 0;
      let conR = 10;

      let curConTime = con['time'];
      let curStimerDot = tools.time2seconds(curConTime[0]);
      let curEtimerDot = tools.time2seconds(curConTime[1]);
      let STheta = timeLinear(curStimerDot);
      let ETheta = timeLinear(curEtimerDot);

      ETheta = STheta + ((((ETheta - STheta) * 3) < 0.3) ? 0.3 : (ETheta - STheta) * 3);
      timeLinear = d3.scaleLinear([0, _this.videoDur], [0, Math.PI * 2 - (ETheta - STheta)]);
      let rlen = r + outsideR;
      // let sx = x + rlen * Math.sin(STheta);
      // let sy = y - rlen * Math.cos(ETheta);  
      let importanceValue = con['attribute']['importance'];
      let circleColor = compute_color(color_linear(importanceValue));
      // tools.drawCircle(svg, cx, cy, 7, "red", 1, "white", 1, "circle", `relCon_${con['id']}_${curcon['id']}`);
      var dataset = { startAngle: STheta, endAngle: ETheta }; //创建一个弧生成器
      var arcPath = d3.arc()
        .innerRadius(rlen - outsideR)
        .outerRadius(rlen + outsideR);
      var pathArc = arcPath(dataset);
      // (svg, x, y, arcPath, stroke, fill, className, idName, stroke_dasharray, width)
      tools.drawArc(svg, x, y, pathArc, circleColor, circleColor, "relCon", `relCon_${con['id']}_${con['id']}`, "0", 5);

      let ptheta = 0;
      let minGapTheta = Math.PI / 6;
      rel.sort((a,b)=>{
        
        let curcon1 = conceptsData.find((d) => { return d['id'] == a; })
        let curConTime1 = curcon1['time'];

        let curcon2 = conceptsData.find((d) => { return d['id'] == b; })
        let curConTime2 = curcon2['time'];
        return (tools.time2seconds(curConTime1[0]) - tools.time2seconds(curConTime2[0]));
      })
      rel.forEach((relCon) => {
        let curcon = conceptsData.find((d) => { return d['id'] == relCon; })
        let curConTime = curcon['time'];
        let curtimerDot = (tools.time2seconds(curConTime[0]) + tools.time2seconds(curConTime[1])) / 2;
        let curTheta = timeLinear(curtimerDot);
        if((((curTheta-ptheta))<minGapTheta))curTheta=ptheta + minGapTheta;
        if ((curTheta > (STheta - minGapTheta)) && (curTheta < (ETheta+minGapTheta))) {
          curTheta = minGapTheta + (ETheta);
        }
        ptheta = curTheta;
        let cx = x + rlen * Math.sin(curTheta);
        let cy = y - rlen * Math.cos(curTheta);
        let importanceValue = curcon['attribute']['importance'];
        let circleColor = compute_color(color_linear(importanceValue));
        tools.drawCircle(svg, cx, cy, 4, circleColor, 1, "white", 0, "relCon", `relCon_${con['id']}_${curcon['id']}`);
      })
    },
    drawConTags(svg, con, x, y, h) {
      const _this = this;
      let tags = Array.from(new Set([...con['serTags'],...con['tags']]));
      let cId = con['id'];
      let tagsData = this.tagsData;
      let tagOdata = [];
      let r = 12;
      let stepr = 7;
      let rTot = 0;
      let waiColor = "rgb(107, 107, 107)";

      svg.selectAll('.conTags').remove();
      tags.forEach((ele, ind) => {
        let tag = tagsData.find(function (d) { return d['id'] == ele });
        tagOdata.push(tag);
        let serveConcepts = tag['serveConcepts'];
        let len = serveConcepts.length;
        
        let type = tag['type'];
        if(type=='text'){
          len=0;
        }
        let rNum = (len - 1) < 0 ? 0 : (len - 1);
        let cr = r + stepr * (rNum);
        rTot += cr;
      })
      let sevR = (h - rTot * 2) / (tags.length + 1);
      let sY = y + sevR - 15;
      let tY = y + h - sevR + 15;

      let points = tools.calcTriangle(x, sY, 4);
      let sEnt = tools.drawPolygon(svg, points, `conTagsSourceIcon${cId}`, 1, waiColor, waiColor, "conTags");
      sEnt
        .transition()  // 开始执行动画
        .duration(1000)
        .style("transform-origin", "center")
        .style("transform-box", "fill-box")
        .attr("transform", `rotate(${180})`);
      let eEnt = tools.drawCircle(svg, x, sY, 4, waiColor, 1, "white", 0, "conTags", `conTagsTargetIcon${cId}`);
      eEnt
        .transition()  // 开始执行动画
        .duration(1000)
        .attr("cx", x)
        .attr("cy", tY)
      let preY = y + sevR;
      let px = this.px;
      let jiantouPath1 = d3.path();
      jiantouPath1.moveTo(x, sY);
      jiantouPath1.lineTo(x, sY);
      let jiantouPath = d3.path();
      jiantouPath.moveTo(x, sY);
      jiantouPath.lineTo(x, tY);
      let pathE = tools.drawTimeLine(svg, jiantouPath1, waiColor, 1.5, '4,5', `conTags${con['id']}`, 'conTags');
      pathE.transition()
        .duration(1000)
        .attr('d', jiantouPath)

      let color_linear = _this.importanceColor_linear;
      let compute_color = _this.importanceCompute_color;
      
      tagOdata.forEach((tag, ind) => {
        let ele = tag['id'];
        let type = tag['type'];
        let serveConcepts = tag['serveConcepts'];
        let len = serveConcepts.length;
        let points = [];
        let stroke = 'rgb(175, 195, 230)';
        let fill = 'rgb(175, 195, 230)';


        let cx = x;
        if(type=='text'){
          len=0;
        }
        let rNum = (len - 1) < 0 ? 0 : (len - 1);
        let cy = preY + r + stepr * (rNum);

        preY = cy + r + stepr * (rNum) + sevR;
        for (let i = len - 1; i >= 0; i--) { 
          let con =   this.conceptsData.find((d) => { return d['id'] == serveConcepts[i]; });
          let importanceValue = con['attribute']['importance']; 
          let cirFill = compute_color(color_linear(importanceValue));
          let cCir = tools.drawCircle(svg, cx, cy, 0, cirFill, 1, "white", 1, 'conTags', `conTagsCir_${cId}_${ele}_${i}`);

          cCir.transition()
            .duration((((ind+1)*(2000/(tagOdata.length+1)))/(i+1)))
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", r + stepr * i)
        }
        // let tagsEnt = tools.drawPolygon(svg, points, `conTags${ele}`, 10, stroke, fill);
        let imgUrl = require(`@/assets/img/tagsIcon/tag_${type}.png`);
        // tools.drawCircle(svg, cx, cy, r, fill, 1, stroke, 1, 'circle',' idName')
        // let tagsEnt = tools.drawPolygon(svg, points, `conTags${ele}`, 0, stroke, fill);
        let tagsEnt = tools.drawImage(svg, 0, 0, cx, cy, imgUrl, `conTags_${cId}_${ele}`, 'conTags');
          tagsEnt.transition()
          .duration(1000)
            .attr("width", 20)
            .attr("height", 20)          
            .attr("x", cx-10)
            .attr("y", cy-10)
      })
    },
    drawSerTags(svg, con, x, y, r, color) {
      const _this = this;
      let tags = Array.from(new Set([...con['serTags'],...con['tags']]));
      let tagsData = this.tagsData;
      let len = tags.length;
      let id = con['id']
      let sevR = 15;
      let outsideR = 23
      let jiantouPath = d3.path();
      let sTheta = -Math.PI / 2 //- Math.PI / 6;
      let tTheta = Math.PI + Math.PI / 5;
      let waiColor = "rgb(107, 107, 107)";


      let timeDur = con['time'];
      // 0, this.videoDur
      // 
      jiantouPath.arc(x, y, r + outsideR, sTheta, tTheta)//Math.PI * 2-Math.PI/2-Math.PI/2);
      tools.drawTimeLine(svg, jiantouPath, waiColor, 1.5, '2,3', "conIncon", "conIncon");
      let thetaLinear = d3.scaleLinear([tools.time2seconds(timeDur[0]), tools.time2seconds(timeDur[1])], [sTheta + Math.PI / 2, tTheta + Math.PI / 2]);


      let rlen = r + outsideR;
      let csx = x + rlen * Math.sin(sTheta + Math.PI / 2);
      let csy = y - rlen * Math.cos(sTheta + Math.PI / 2);

      let ctx = x + rlen * Math.sin(tTheta + Math.PI / 2);
      let cty = y - rlen * Math.cos(tTheta + Math.PI / 2);


      let points = tools.calcTriangle(csx, csy, 2);
      let sEnt = tools.drawPolygon(svg, points, `conSourceIcon${id}`, 1, waiColor, waiColor,"conIncon");
      sEnt.style("transform-origin", "center")
        .style("transform-box", "fill-box")
        .attr("transform", `rotate(${180 * sTheta / Math.PI + 66})`);
      tools.drawCircle(svg, ctx, cty, 2, waiColor, 1, waiColor, 1, "conIncon", `conTargetIcon${id}`);

      let ptheta = sTheta + Math.PI / 2;
      tags.forEach((ele, ind) => {
        let tag = tagsData.find(function (d) { return d['id'] == ele });
        let type = tag['type'];
        let timeDot = (tag['timeDur'][0] + tag['timeDur'][1]) / 2;
        let points = [];
        let stroke = color//'rgb(175, 195, 230)';
        let fill = color//'rgb(175, 195, 230)';
        let rlen = r + outsideR;
        let stepR = Math.PI / 5;
        let curTheta = stepR * (ind + 1);//thetaLinear(timeDot)/
        // tTheta = curTheta;
        let minGapTheta = Math.PI / 7;
        // if((Math.abs(curTheta-ptheta)<minGapTheta))curTheta=ptheta + minGapTheta;
        ptheta = curTheta;
        let imgR = 19;
        if (type == 'text') {
          rlen -= 1;
          imgR += 1
        }
        let cx = x + rlen * Math.sin(curTheta);
        let cy = y - rlen * Math.cos(curTheta);
        let imgUrl = require(`@/assets/img/tagsIcon/tag_${type}.png`);
        // tools.drawCircle(svg, cx, cy, r, fill, 1, stroke, 1, 'circle',' idName')
        // let tagsEnt = tools.drawPolygon(svg, points, `conTags${ele}`, 0, stroke, fill);
        let tagsEnt = tools.drawImage(svg, imgR, imgR, cx, cy, imgUrl, `conSerTags_${con['id']}_${ele}`, 'serConTags');

        // console.log('tg',timeDot,tag,tools.time2seconds(timeDur[0]),tools.time2seconds(timeDur[1]),curTheta,sTheta,tTheta)
        tagsEnt
          .style("transform-origin", "center")
          .style("transform-box", "fill-box")
          .attr("transform", `rotate(${180 * curTheta / Math.PI})`)
      })

    },
    drawProgressBar() {
      let width = this.$refs.progressBar.offsetWidth;
      let height = this.$refs.progressBar.offsetHeight;
      let data = this.conceptsData;
      let svg = d3.select("#progressBar").append("svg")
        .attr("id", "progressBarSvg")
        .attr("width", width)
        .attr("height", height);
      let inpPath = d3.path();
      let videoDur = this.videoDur;
      let xLinear = d3.scaleLinear([0, videoDur], [0, width]);
      inpPath.moveTo(0, height);
      let lineData = [[0, height]]
      // lineData.push([0,0])


      let inPColor = 'grey';
      let maxValue = Math.max.apply(Math, data.map(function (d) { return d['attribute']['importance']; }))

      let hLinear = d3.scaleLinear([0, maxValue], [10, height]);
      data.forEach((con, ind) => {
        let time = con['time'];
        let timeDot = (tools.time2seconds(time[0]) + tools.time2seconds(time[0])) / 2;
        let inpValue = con['attribute']['importance'];
        lineData.push([xLinear(timeDot), height - hLinear(inpValue)])
      });
      lineData.push([width, height]);
      let curve_generator = d3.line()
        .x((d) => d[0])
        .y((d) => d[1])
        .curve(d3.curveBundle);
      // .curve(d3.curveCatmullRom  )
      // .curve(d3.curveBasis)

      let p = tools.drawTimeLine(svg, curve_generator(lineData), inPColor, 1, '', `inpLine`, 'inpLine');
      p.attr("fill", "rgb(43, 124, 182)")
      let axisDur = 120;
      let stepDur = 12;
      let xIndex = 0;
      let py = 15;
      while ((xIndex * stepDur) < videoDur) {
        let cx = xLinear(xIndex * stepDur);
        xIndex += 1;
        let cy = (py == 10) ? 15 : 10;
        let w = 1;
        py = cy;
        let path = d3.path();
        path.moveTo(cx, 0);
        path.lineTo(cx, cy);
        let lineColor = "grey";
        let textColor = "black";
        if ((stepDur * xIndex) % axisDur == 0) {
          w = 2;
          cy += 3;
          let name = tools.seconds2time(xIndex * stepDur, 1);
          let axisTxt = tools.drawTxt(svg, cx, 15, name, textColor, 14, `axisLtxts${xIndex}`);
          axisTxt[0].attr("transform", `translate(-${axisTxt[1]['width'] / 2},${axisTxt[1]['height']})`);
        }
        tools.drawTimeLine(svg, path, lineColor, w, '', `axisLine_${xIndex}`, 'axisLine');
      }
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
        .attr("style", `background: linear-gradient(90deg, rgba(43, 124, 182,0.5) ${mid}%,rgb(234, 234, 234) ${mid}%) !important;  width: ${widths}`)
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
      let htags = [];
      for (let t in tagsData) {
        let timeDur = tagsData[t]['timeDur'];
        let sTime = timeDur[0];
        let eTime = timeDur[1];
        if ((timeDot > sTime) && (timeDot < eTime)) {
          tags.push(tagsData[t])
        }
        let hoverTimeDurs = tagsData[t]['conTime'];
        hoverTimeDurs.forEach((ti)=>{

          let sT = tools.time2seconds(ti[0]);
          let eT = tools.time2seconds(ti[1]);
          if ((timeDot > sT) && (timeDot < eT)) {
            htags.push(tagsData[t])
          }
        })
      }
      _this.tagsList = [tags,htags];
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
      var g = d3.select("#videoScript").append("svg")
        .attr("id", "videoScriptSvg")
        .attr("width", width)
        .attr("height", height);
      let rg = g.append("g");
      let svg = g.append("g");

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
        let conNameList = ["variable","variables","probability","mean","variance"];
        if (((ketText.indexOf(name) != -1) && (stopList.indexOf(name) == -1)||(conNameList.indexOf(name) != -1))) {
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
      let txtDom = document.getElementById('videoScriptSvg')
      let txtBbox = txtDom.getBBox();
      let cx = txtBbox['x'];
      let cy = txtBbox['y'];
      let w = txtBbox['width'];
      let h = txtBbox['height'];
      let rColor = 'grey';
      tools.drawRect(rg, cx - 5, cy-5, w+5, h+5, 5, rColor, 2, rColor, 0.5, "videoScriptBack", "videoScriptBack");
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
    let data = this.conceptsData;
    let ketText = [];
    for (let i = 0; i < data.length; i++) {
      let names = data[i]['name'].split(" ");
      for (let n in names) {
        ketText.push(names[n]);
      }
    }
    _this.ketText = ketText;

    this.$bus.$on('tagsColor', (val) => {
      _this.tagsColor = val;
    });
    this.$bus.$on('certenTag', (val) => {
      _this.certenTag = val;
    });
    this.$bus.$on('relData', (val) => {
      _this.relData = val;
    });
    this.$bus.$on('videoTotalDur', (val) => {
      _this.videoDur = val;
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
