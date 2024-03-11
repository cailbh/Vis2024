<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable no-unused-vars -->

<template>
  <div :class="VideoClass" ref="videoDiv">

    <!-- <div class="panelHead"></div> -->
    <div class="perVideo">
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
      <div id="iconVideo2">
        <img class="iconUpload" :src="videoUrl2">
      </div>

      <div id="iconVideo3">
        <img class="iconUpload" :src="videoUrl3">
      </div>

      <div id="iconVideo4">
        <img class="iconUpload" :src="videoUrl4">
      </div>

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
      certenTag:"",
      tagVideoSize: [640, 360],
      playOrPause: true,
      showGraph: false,
      showExternal: false,
      tagLinearW:'',
      tagLinearH:''
    };
  },
  watch: {
    timeDur(val) {
      this.timeDot = tools.time2seconds(val[0]);
    },
    scriptsText(val) {
      this.drawScript();
    },
    certenTag(val){
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
    playOrPauseClick(){
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
      let tagLinearW =_this.tagLinearW;
      let tagLinearH = _this.tagLinearH;
      
      let boundingBox = tag['boundingBox'];
      let x = tagLinearW(boundingBox['left']);
      let y = tagLinearH(boundingBox['top']);
      let width = tagLinearW(boundingBox['width']);
      let height = tagLinearH(boundingBox['height']);

      let videoWidth = this.videoWidth; //- margin.left - margin.right;
      let videoHeight = this.videoHeight;
      let svg = d3.select("#VideoEditPanel").select("svg");
      svg.select("#videoTags").remove();
      let backg = svg.append("g")
        .attr("class", "videoShowTags")
        .attr("width", videoWidth)
        .attr("height", videoHeight);
      let g = svg.append("g")
        .attr("class", "videoShowTags")
        .attr("width", videoWidth) 
        .attr("height", videoHeight);
        
      let canvas = tools.getVideoCanvas("playVideo");
      console.log(canvas,x,y,width,height);
      const data = canvas.getContext("2d").getImageData(x, y, width, height);
      // const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
      var canvass = document.createElement("canvas");
      canvass.width = width;
      canvass.height = height;
      canvass.getContext("2d").putImageData(data, 0, 0);
      var dataURL = canvass.toDataURL("image/png");  //将图片转成base64格式
      var img = document.createElement('img');
      img.src = dataURL;

      StackBlur.canvasRGB(canvas, 0, 0, videoWidth, videoHeight, 100);
      var dataURLBack = canvas.toDataURL("image/png");  //将图片转成base64格式
      var imgBack = document.createElement('img');
      imgBack.src = dataURLBack;
      backg.append("image")
        .attr("class", "videoShowTags")
        .attr("width", videoWidth)
        .attr("height", videoHeight)
        .attr("xlink:href", dataURLBack)
      g.append("image")
        .attr("width", width)
        .attr("height", height)
        .attr("xlink:href", dataURL)
        .attr("transform", function (d) {
          return `translate(${(videoWidth - width) / 2},${(videoHeight - height) / 2})`;
        })
        .on("click", function (d) { _this.tagsClick(tag)});
      // tools.drawRect(svg,0, 0, 100, 100, 2,"rgba(250,0,250,1)",2,"rgb(0,0,0)",1, `aaa111`,"videoTagRect");
    },
    getVideoTime(val) {
      const _this = this;
      _this.timeNow = tools.seconds2time(parseInt(val).toFixed(0));
      _this.overTime = tools.seconds2time(_this.videoDur);
      let margin = _this.margin;
      let width = this.$refs.progressBar.offsetWidth;
      let widths = 'calc(100% - 10px)'
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
        .attr("style", `background: linear-gradient(90deg, rgb(200, 200, 200) ${mid}%,rgb(244, 244, 244) ${mid}%) !important;  width: ${widths}`)
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
        let textColor = "black";
        let stopList = ["of", "the", "and", "be", "two", "x", "y", "z", "a", "to"];
        if ((ketText.indexOf(name) != -1) && (stopList.indexOf(name) == -1)) {
          textColor = "red";
        }
        let svgArea = _this.drawTxt(svg, tx, ty, name, textColor, 24, `txts${i}`);
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
    moveRect(e) {
      const _this = this;
      let selectRect = _this.DivisionDataList.find(function (d) { return d['id'] == _this.selectRectId; })//右边的rect
      let preId = selectRect['preId'];//左边的rect
      let nextId = selectRect['nextId'];//右边的右边rect
      let rectClass = _this.selectRectClass;
      let prex = 0;
      if (preId != '-1') {
        prex = d3.select("#" + rectClass + "_" + preId).attr("x")
        d3.select("#" + rectClass + "_" + preId)
          .attr("width", function (d) {
            return e.offsetX - prex;
          })
      }
      let nextX = 100;
      if (nextId == '-1') {
        nextX = _this.moveLineWidth;
      }
      else {
        nextX = d3.select("#" + rectClass + "_" + nextId).attr("x");
      }
      d3.select("#" + rectClass + "_" + _this.selectRectId)
        .attr("width", function (d) {
          return nextX - e.offsetX;
        })
        .attr("x", e.offsetX)
      d3.select("#division_" + _this.selectRectId)
        .attr("x", e.offsetX - 5)

      if ((e.offsetX > (_this.rootTopicLineWidth)) || (e.offsetX < (0)) || (e.offsetY > (_this.rootTopicLineHeight)) || (e.offsetY < (0))) {
        document.getElementById('rootTopicLineSvg').removeEventListener("mousemove", _this.moveRect); // 
      }
    },
    drawTxt(svg, tx, ty, txts, fill, size, idName) {
      svg.append("text")
        .attr("y", ty)
        .attr("x", tx)
        .attr("id", idName)
        .attr("fill", fill)
        .attr("font-size", size)
        .text(txts)

      let textArea = document.getElementById(idName).getBBox();
      return textArea;
      // .style("text-anchor", anchor)//"middle")
      // .attr("transform", `rotate(${roat} ${tx} ${ty})`);
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
