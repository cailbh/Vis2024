<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable no-unused-vars -->

<template>
  <div class="graph" ref="graphDiv">
    <div id="graphPanel" class="panelBody" ref="pptImages">
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
import RelJson from "@/assets/json/case1_1_fin_rel.json";
import tools from "@/utils/tools.js";
import ocrad from "@/utils/ocrad.js";
import { createWorker } from "@/utils/tesseract.min.js";
import Tesseract from '@/utils/tesseract.min.js';
import ConJson from "@/assets/json/fin.json";

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
      relData:RelJson,
      pptInfo:[],
      videoDur:'',
      curPPT:0,
      curConList:[],
    };
  },

  watch: {
    type(val) {
    },
    curPPT(val){
      tools.sleep(100).then(()=>{
        document.getElementById('graphPanel').scrollLeft = 800;
      })
    },
    showGraph(val) {
      const _this = this;
      if (val) {
        this.$nextTick(() => {
          _this.width = this.$refs.graphDiv.offsetWidth
          _this.height = this.$refs.graphDiv.offsetHeight;
          
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
      document.getElementById('graphPanel').addEventListener('DOMMouseScroll', this.scrollHorizontally, false)

    },
    drawConLine(){
      const _this = this;
      let svgH = 80;
      let svgW = this.width;
      let videoDur = this.videoDur;
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
      let conData = this.conceptsData;
      // let svgW = this.width;
      let r = 10;
      let sx = 0+r*3
      let sy = h/2;
      let tx = w-r*3;
      let ty = h/2;

      let relg = svg.append("g");
      
      var defs = svg.append("defs");

      let grad = defs.append("linearGradient")
        .attr("id", "gradB")
        .attr("x1", "50%").attr("y1", "0%") //
        .attr("x2", "50%").attr("y2", "100%") //
        .attr("width", "300%").attr("height", "300%"); //

      grad.append("stop")
        .attr("offset", "0%")
        .style("stop-color", "rgb(207, 227, 241)")
      grad.append("stop")
        .attr("offset", "80%")
        .style("stop-color", "rgb(207, 227, 241)")
        .style("stop-opacity", "0.1")
      grad.append("stop")
        .attr("offset", "100%")
        .style("stop-color", "rgb(207, 227, 241)")
        .style("stop-opacity", "0")

      let pointsd = [[sx-(r * ((Math.sqrt(3)) / 2+1)), sy-10], [sx + w, sy-10], [sx + w, sy+20], [sx, sy+20]]
      let pgy = tools.drawPolygon(svg, pointsd, `blk`, 0, "grey", "rgba(128, 128, 128,0.4)")
      pgy.attr("fill", "url(#gradB)");


      let color=  "rgb(155, 155, 155)";
      let points = tools.calcTriangle(sx-(r * ((Math.sqrt(3)) / 2+1)), sy, r);
      let sEnt = tools.drawPolygon(svg, points, `conLineAxisTriangle`, 1, color, color,"conLineAxisTriangle");
      sEnt.style("transform-origin", "center")
        .style("transform-box", "fill-box")
        .attr("transform", `translate(${r * (Math.sqrt(3)) / 2-1},${r-(r * (Math.sqrt(3)) / 2)}) rotate(${90})`);
      tools.drawCircle(svg, tx+r, ty, r, color, 1, "white", 1, "conLineAxisCircle", `conLineAxisCircle`);

      let jiantouPath = d3.path();
      jiantouPath.moveTo(sx,sy);
      jiantouPath.lineTo(tx,ty);
      tools.drawTimeLine(svg, jiantouPath, color, 3, '6,3', `conLineAxis`, 'conLineAxis');


      let xLinear = d3.scaleLinear([0, videoDur], [sx, tx]);
//       (let axisDur = 120;
//       let stepDur = 12;
//       let xIndex = 0;
//       let py = 15;
      
//       while((xIndex*stepDur)<videoDur){
//         let cx = xLinear(xIndex*stepDur);
//         let cy = (py==15)?20:15;
//         let w = 1;
//         py = cy;
//         let lineColor=color;
//         let textColor = color;
//         if((stepDur*xIndex)%axisDur==0){
//           w=2;
//           cy+=3;
//           if(xIndex==0){
//             w=3;
//             cy+=2;
//           }
//           let name = tools.seconds2time(xIndex*stepDur,1);
//           let axisTxt = tools.drawTxt(svg, cx, sy+20, name, textColor, 16, `conLineALtxts_${xIndex}`);
//           let textX = -axisTxt[1]['width'] / 2;
//           if(xIndex==0){
//             textX=0//0axisTxt[1]['width']/2;
//           }
//           axisTxt[0].attr("transform", `translate(${textX},${axisTxt[1]['height']})`);
//         }
//         let path = d3.path();
//         path.moveTo(cx,sy);
//         path.lineTo(cx,sy+cy);
//         tools.drawTimeLine(svg, path, lineColor, w, '', `conLineAxisLine_${xIndex}`, 'conLineALine');
//         xIndex+=1;
//       }
// )

      let minW  = 20;
      let gapD = 20;
      let totW = tx - sx;
      conData.forEach((d,i)=>{
        let time = d['time'];
        let cId = d['id'];
        let expDur = d['attribute']['expressions'];
        let rh = 20;
        let ry = h/2 - rh/2;
        let cw = xLinear(tools.time2seconds(time[1])) - xLinear(tools.time2seconds(time[0]));
        if( cw < minW){
          totW -= (minW - cw);
        }
      })
      totW-=gapD*(conData.length+2);
      let wLinear = d3.scaleLinear([0, videoDur], [0, totW]);
      let px = sx-gapD;
      let conLocationData = {}
      conData.forEach((d,i)=>{
        let time = d['time'];
        let cId = d['id'];
        let expDur = d['attribute']['expressions'];
        let w1 = 0;
        let time1 = 0;
        let w2 = 0;
        let time2 = 0;
        let w3 = 0;
        let time3 = 0;
        expDur['1'].forEach((exp)=>{
          let curTimeDur =tools.time2seconds(exp[1]) - tools.time2seconds(exp[0]);
          time1+=curTimeDur;
        });
        expDur['2'].forEach((exp)=>{
          let curTimeDur =tools.time2seconds(exp[1]) - tools.time2seconds(exp[0]);
          time2+=curTimeDur;
        });
        expDur['3'].forEach((exp)=>{
          let curTimeDur =tools.time2seconds(exp[1]) - tools.time2seconds(exp[0]);
          time3+=curTimeDur;
        });
        let totTime = time1 + time2 + time3;
        
        let rh = 20;
        let ry = h/2 - rh/2;
        let cx = px+gapD;
        let cw = wLinear(tools.time2seconds(time[1])-tools.time2seconds(time[0]));        
        if( cw < minW){
          cw = minW;
        }
        px=cx+cw;
        let tpLinear = d3.scaleLinear([0, totTime], [0, cw]);


        let rColor = "white";
        let rColor1 = "rgb(10, 105, 173)";
        let rColor2 = "rgb(115, 191, 187)";
        let rColor3 = "rgb(237, 244, 201)";
        let conRect = tools.drawRect(svg, cx, ry, cw, rh, 10, rColor, 1, "white", 1, `conLineRect_${cId}`, "conLineRect");
        conLocationData[cId]=[cx,cw];
        conRect.style("filter", "drop-shadow(4px 1px 4px rgb(175, 171, 171))");
        if((time2>0)&&(time1>0)){
          let conRect12g1 = tools.drawRect(svg, cx+tpLinear(time1)/2, ry, tpLinear(time1)/2, rh, 0, rColor1, 1, rColor1, 1, `conLineRect121_${cId}`, "conLineRect");
          let conRect12g2 = tools.drawRect(svg, cx+tpLinear(time1), ry, tpLinear(time2)/2, rh, 0, rColor2, 1, rColor2, 1, `conLineRect122_${cId}`, "conLineRect");
        }
        if((time3>0)&&(time2>0)){
          let conRect23g1 = tools.drawRect(svg, cx+tpLinear(time1)+tpLinear(time2)/2, ry, tpLinear(time2)/2, rh, 0, rColor2, 1, rColor2, 1, `conLineRect231_${cId}`, "conLineRect");
          let conRect23g2 = tools.drawRect(svg, cx+tpLinear(time1)+tpLinear(time2), ry, tpLinear(time3)/2, rh, 0, rColor3, 1, rColor3, 1, `conLineRect232_${cId}`, "conLineRect");
        }
        let conRect1 = tools.drawRect(svg, cx, ry, tpLinear(time1), rh, 10, rColor1, 1, rColor1, 1, `conLineRect1_${cId}`, "conLineRect");
        let conRect2 = tools.drawRect(svg, cx+tpLinear(time1), ry, tpLinear(time2), rh, 10, rColor2, 1, rColor2, 1, `conLineRect2_${cId}`, "conLineRect");
        let conRect3 = tools.drawRect(svg, cx+tpLinear(time1)+tpLinear(time2), ry, tpLinear(time3), rh, 10, rColor3, 1, rColor3, 1, `conLineRect3_${cId}`, "conLineRect");
        // conRect.attr("style", `background: linear-gradient(90deg, rgba(43, 124, 182,0.5) ${20}%,rgb(234, 234, 234) ${30}%) !important`)
      })

      let relData = this.relData;
      let basicRels = relData['basicRel'];
      let hScale_linear = d3.scaleLinear([0, w/3], [15, h/2-10])
      basicRels.forEach((rel)=>{
        let rsId = rel[0];
        let rtId = rel[1];
        let rsx = conLocationData[rsId][0] + conLocationData[rsId][1] / 2;
        let rtx = conLocationData[rtId][0] + conLocationData[rtId][1] / 2;
        let path = d3.path();
        let lineColor = "rgb(198, 198, 198)";
        let yh = hScale_linear(Math.abs(rtx - rsx));
        path.moveTo(rsx,h/2);
        path.lineTo(rsx,h/2-yh);
        path.lineTo(rtx,h/2-yh);
        path.lineTo(rtx,h/2);
        tools.drawTimeLine(relg, path, lineColor, 2, '', `conRelLine_${rsId}_${rtId}`, 'conRelLine');
      })
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
    this.$bus.$on('curPPT', (val) => {
      _this.curPPT = val;
    });
    this.$bus.$on('curConList', (val) => {
      console.log("con",val)
      _this.curConList = val;
    });
    this.$bus.$on('curCon', (val) => {
      console.log("cons",val)
      _this.curConList = val;
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
