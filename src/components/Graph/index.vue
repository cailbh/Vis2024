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
              <span>{{ pptInfo[index].name }}</span>
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
export default {
  props: ["videoTime"],
  data() {
    return {

      width: "",
      height: "",
      margin: { top: 15, right: 5, bottom: 5, left: 5 },
      showGraph: false,

      imgMap: ImgMapJson,
      pptInfo:[]

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

      d3.select("#graphPanel").select("svg").remove();
      let svg = d3.select("#graphPanel").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", `translate(${margin.left},${margin.top})`);
      
      
    document.getElementById('graphPanel').addEventListener('DOMMouseScroll', this.scrollHorizontally, false)

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

  },
  beforeDestroy() {
    clearInterval(this.moveTimer);
  },
} 
</script>

<style>
@import './index.css';
</style>
