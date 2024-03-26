<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable no-unused-vars -->

<template>
  <div class="externalPanel">
    <!-- <div class="panelHead">SupportPanel</div> -->
    <div id="externalPanelBody" class="panelBody" ref="externalDiv">
      <div class="chatWin">
        <ChatWindow></ChatWindow>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import TestRelJson from "@/assets/json/case1_1_fin_rel.json";
import tools from "@/utils/tools.js";
import ChatWindow from '@/components/ChatWindow/index.vue';

export default {
  components: {
    ChatWindow,
  },
  props: [],
  data() {
    return {
      showExternal: false,
      width: '',
      height: '',
      zoomVideoWidth: 640,
      zoomVideoHeight: 360,
      videoG: '',
      tagVideoSize: [640, 360],
      
      // tagVideoSize: [2540, 1440],
      tagsList: [],
      certenTag:'',
      tagsColor:''
    };
  },
  watch: {
    showExternal(val) {
      const _this = this;
      if (val) {
        this.$nextTick(() => {
          _this.width = this.$refs.externalDiv.offsetWidth
          _this.height = this.$refs.externalDiv.offsetHeight
          _this.drawMain();
        });
      }
    }
  },
  methods: {
    drawMain() {
      const _this = this;
      let width = _this.width;
      let height = _this.height;
      d3.select("#externalPanelBody").select("svg").remove();
      let svg = d3.select("#externalPanelBody").append("svg")
        .attr("class", "externalShowTags")
        .attr("width", width)
        .attr("height", height)
      // .attr("transform", `translate(${margin.left},${margin.top})`);
      let videoG = svg.append("g")
        .attr("class", "externalShowTags")
        .attr("width", width)
        .attr("height", height)
      let tagsG = svg.append("g")
        .attr("class", "externalShowTags")
        .attr("width", width)
        .attr("height", height)
      _this.videoG = videoG;
      _this.tagsG = tagsG;
      _this.drawVideo();
      _this.drawTags();
    },
    drawVideo() {
      const _this = this;
      let g = this.videoG;
      let videoWidth = this.width;
      let videoHeight =  this.width*this.zoomVideoHeight / this.zoomVideoWidth ;
      let canvas = tools.getVideoCanvas("playVideo");
      // StackBlur.canvasRGB(canvas, 0, 0, videoWidth, videoHeight, 100);
      var dataURLBack = canvas.toDataURL("image/png");  //将图片转成base64格式
      var imgBack = document.createElement('img');
      imgBack.src = dataURLBack;
      g.append("image")
        .attr("class", "videoShowTags")
        .attr("width", videoWidth)
        .attr("height", videoHeight)
        .attr("vector-effect", "non-scaling-stroke")
        .attr("preserveAspectRatio","none") 
        .attr("xlink:href", dataURLBack)

      // tools.drawRect(g, x, y, w, h, rx, fill, strokeWidth, stroke, opacity, idName, className,'0')
    },
    tagsClick(tag) {
      this.certenTag = tag;
      this.$bus.$emit("certenTag", tag);
    },
    drawTags() {
      const _this = this;
      let g = this.tagsG;
      let width = this.width;
      let height = this.zoomVideoHeight * this.width / this.zoomVideoWidth;
      let tags = _this.tagsList;
      let tagsColor = _this.tagsColor;
      let tagVideoSize = this.tagVideoSize;
      let tagLinearW = d3.scaleLinear([0, tagVideoSize[0]], [0, width]);
      let tagLinearH = d3.scaleLinear([0, tagVideoSize[1]], [0, height]);
      for (let i = 0; i < tags.length; i++) {
        let boundingBox = tags[i]['boundingBox'];
        let x = tagLinearW(boundingBox['left']);
        let y = tagLinearH(boundingBox['top']);
        let w = tagLinearW(boundingBox['width']);
        let h = tagLinearH(boundingBox['height']);
        let type = tags[i]["type"];
        let color = tagsColor[type];
        let tagId = tags[i]['id'];
        let tsgRect = tools.drawRect(g, x, y, w, h, 1, color, 1, color, 0.1, `videoRect${tagId}`, "videoTagRect");
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
      }
    }
  },
  created() {
    const _this = this;
    this.$nextTick(() => {

    });
  },
  mounted() {

    const _this = this;
    this.$bus.$on('showExternal', (val) => {
      _this.showExternal = val;
    });
    this.$bus.$on('tagsList', (val) => {

      _this.tagsList = val;
    });
    this.$bus.$on('tagsColor', (val) => {
      _this.tagsColor = val;
    });
  },
  // beforeDestroy() {
  //   clearInterval(this.moveTimer);
  // },
} 
</script>

<style>
@import './index.css';
</style>
