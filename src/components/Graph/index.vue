<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable no-unused-vars -->

<template>
  <div class="graph" ref="graphDiv">
    <div id="graphPanel" class="panelBody">
      <div class="images">
        <div v-for="(item, index) in pptInfo" :key="index" class="image-middle">
          <el-card shadow="hover" :body-style="{ padding: '10px' }">
            <!-- //添加鼠标点击或悬浮图片放大功能 -->
            <el-popover
            placement="bottom"
            :title=item.name 
            trigger="hover"
                    >
              <img :src="pptInfo[index].src" slot="reference" class="image" />
              <img :src="pptInfo[index].src" class="imagePreview" />
            </el-popover>
            <div style="text-align:center;padding-top:12px">
              <!-- <span>{{ pptInfo[index].name }}</span> -->
            </div>
          </el-card>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { Loading } from 'element-ui'
import { onMounted, ref } from 'vue';
import domtoimage from 'dom-to-image';
import TestJson from "@/assets/json/case1_1_fin.json";
import ImgMapJson from "@/assets/Case1-Slides/imgMap.json";
import TestRelJson from "@/assets/json/case1_1_fin_rel.json";
import tools from "@/utils/tools.js";
import ocrad from "@/utils/ocrad.js";
import { createWorker } from "@/utils/tesseract.min.js";
import Tesseract from '@/utils/tesseract.min.js';
import ConJson from "@/assets/json/case2_fin.json";

export default {
  props: ["videoTime"],
  data() {
    return {

      width: "",
      height: "",
      margin: { top: 15, right: 5, bottom: 5, left: 5 },
      showGraph: false,
      conceptsData: ConJson,
      imgMap: ImgMapJson,
      pptInfo:[],
      videoDur:''

    };
  },

  watch: {
    type(val) {
    },
    showGraph(val) {
      const _this = this;
      if (val) {
        this.$nextTick(() => {
          _this.width = this.$refs.graphDiv.offsetWidth
          _this.height = this.$refs.graphDiv.offsetHeight
          _this.drawMain();
        });
      }
    }
  },
  methods: {
    drawMain() {
      let _this = this;
      let margin = _this.margin;
      let width = _this.width - margin.left - margin.right;
      let height = _this.height - margin.top - margin.bottom;

      let imgMap  =_this.imgMap;
      let pptInfo = [];
      for(let i=0;i<imgMap.length-1;i++){
         let curUrl = require(`@/assets/Case1-Slides/${imgMap[i]}.png`);
          let curPpt = {
          "id":i,
          "name":imgMap[i]+"",
          "src":curUrl
        }
        pptInfo.push(curPpt);
      }

      _this.pptInfo = pptInfo;
      this.drawConLine();
        // .attr("transform", `translate(${margin.left},${margin.top})`);
      
      
    document.getElementById('graphPanel').addEventListener('DOMMouseScroll', this.scrollHorizontally, false)

    },
    drawConLine(){
      const _this = this;
      let svgH = 80;
      let svgW = this.width;
      let conData = this.conceptsData;
      let videoDur = this.videoDur;

      console.log(videoDur,conData);
      d3.select("#graphPanel").select("svg").remove();
      let svg = d3.select("#graphPanel").append("svg")
        .attr("width", svgW)
        .attr("height", svgH)
        .style("position","absolute")
        .style("bottom","0px");
      let axisG = svg.append("g");
      this.drawAxis(axisG,svgW,svgH,videoDur);

    },
    drawAxis(svg,w,h,videoDur){
      const _this = this;
      // let svgW = this.width;
      let r = 10;
      let sx = 0+r*2
      let sy = h/2;
      let tx = w-r*2;
      let ty = h/2;

      let color=  "rgb(155, 155, 155)";
      let points = tools.calcTriangle(sx, sy, r);
      let sEnt = tools.drawPolygon(svg, points, `conLineAxisTriangle`, 1, color, color,"conLineAxisTriangle");
      sEnt.style("transform-origin", "center")
        .style("transform-box", "fill-box")
        .attr("transform", `translate(${r * (Math.sqrt(3)) / 2-1},${r-(r * (Math.sqrt(3)) / 2)}) rotate(${90})`);
      tools.drawCircle(svg, tx, ty, r, color, 1, "white", 1, "conLineAxisCircle", `conLineAxisCircle`);

      let jiantouPath = d3.path();
      jiantouPath.moveTo(sx,sy);
      jiantouPath.lineTo(tx,ty);
      tools.drawTimeLine(svg, jiantouPath, color, 3, '9,9', `conLineAxis`, 'conLineAxis');

      let axisDur = 120;
      let stepDur = 12;
      let xIndex = 0;
      let py = 15;
      
      let xLinear = d3.scaleLinear([0, videoDur], [sx, tx]);
      while((xIndex*stepDur)<videoDur){
        let cx = xLinear(xIndex*stepDur);
        let cy = (py==15)?20:15;
        let w = 1;
        py = cy;
        let lineColor=color;
        let textColor = color;
        if((stepDur*xIndex)%axisDur==0){
          w=2;
          cy+=3;
          if(xIndex==0){
            w=3;
            cy+=2;
          }
          let name = tools.seconds2time(xIndex*stepDur,1);
          let axisTxt = tools.drawTxt(svg, cx, sy+20, name, textColor, 16, `conLineALtxts_${xIndex}`);
          let textX = -axisTxt[1]['width'] / 2;
          if(xIndex==0){
            textX=0//0axisTxt[1]['width']/2;
          }
          console.log(sy,axisTxt[1]['height'])
          axisTxt[0].attr("transform", `translate(${textX},${axisTxt[1]['height']})`);
        }
        let path = d3.path();
        path.moveTo(cx,sy);
        path.lineTo(cx,sy+cy);
        tools.drawTimeLine(svg, path, lineColor, w, '', `conLineAxisLine_${xIndex}`, 'conLineALine');
        xIndex+=1;
      }
    },
    scrollHorizontally(e) {
        e = window.event || e;
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        document.getElementById('graphPanel').scrollLeft -= (delta * 140); // Multiplied by 40
        e.preventDefault();
    }
  },
  mounted() {
    const _this = this;
    this.$bus.$on('showGraph', (val) => {
      _this.showGraph = val;
    });
    
    this.$bus.$on('videoDurs', (val) => {
      _this.videoDur = val;
    });

  },
  beforeDestroy() {
    clearInterval(this.moveTimer);
  },
} 
</script>

<style>
@import './index.css';
</style>
