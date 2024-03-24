<template>
  <div id="root" style="font-family: 'Arial';">
    <!-- <button1 ref="button1"></button1>
    <button v-on:click="clickHandler">按钮</button> -->
    <!-- <svg width="1200" height="1000"></svg> -->

    <div id="Container">
      <!-- <div id="Container-back"></div> -->
      <div id="head">

        <Head></Head>
      </div>
      <div id="allBody">
        <div id="left">

          <!-- <div id="controlPanel" class="panel">
            <ControlPanel></ControlPanel>
          </div>
          <div id="overviewPanel" class="panel">
            <OverviewPanel></OverviewPanel>
          </div> -->
        </div>
        <transition name="graphTran">
          <div id="graphContainer" v-show="showGraph" class="panel">
            <Graph @timeDur="getTimeDur" :videoTime="videoTime" @toolState="getToolState"></Graph>
          </div>
        </transition>
        <div id="videoContainer" v-show="showVideo" class="panel">
          <Video :timeDur="timeDur" @videoTime="getVideoTime"></Video>
          <!-- <scene :type="barType" :sky="skyState" :showLabelState="showLabelState"></scene> -->
        </div>
        <transition name="externalTran">
          <div id="externalPanel" v-show="showExternal" class="panel">
            <ExternalPanel></ExternalPanel>
          </div>
        </transition>
        <!-- <transition name="sceneTran">

        <div id="ExternalPanel" class="panel" v-if='showEdit == true'>
          
        </div>
        </transition> -->
      </div>
    </div>
  </div>
</template>

<script>
import Video from '@/components/Video/index.vue'
import Graph from '@/components/Graph/index.vue'
import ControlPanel from '@/components/ControlPanel/index.vue'
import ExternalPanel from '@/components/ExternalPanel/index.vue'
import OverviewPanel from '@/components/OverviewPanel/index.vue'
export default {
  // components: { scene,Head,homeLeft,homeRight,homeBottom,navBar,uiBtns},
  components: { Video, Graph, ControlPanel, OverviewPanel, ExternalPanel },
  /* eslint-disable no-unused-vars */
  data() {
    return {
      timer: null,
      showVideo: true,
      showGraph: false,
      showExternal: false,
      showEdit: true,
      selectEntId: "0",
      selectEnt: "0",
      toolState: '',
      timeDur: "",
      videoTime: 0,
      playOrPause: true,
      windowWidth: document.documentElement.clientWidth, //实时屏幕宽度
      windowHeight: document.documentElement.clientHeight, //实时屏幕高度
      mcolor: [
        "rgb(255,60,60)",
        "rgb(155,20,100)",
        "rgb(255,83,255)",
        "rgb(200,100,50)",
        "rgb(235,135,162)",
        "rgb(200,200,102)",
        "rgb(255,178,101)",
        "rgb(63,151,134)",
        "rgb(83,155,255)",
        "rgb(50,200,120)",
        "rgb(2,50,200)",
        "rgb(0,122,244)",
        "rgb(150,122,244)",
        "rgb(168,168,255)",
        "rgb(200,200,200)",
      ],
      mLigntcolor: [
        "#ff9c9c",
        "#cc88b0",
        "#ffa8ff",
        "#e3b097",
        "#f4c3d0",
        "#f4f4d0",
        "#ffd8b1",
        "#9ecac2",
        "#a8ccff",
        "#97e3ba",
        "#6f8be0",
        "rgb(0,122,244)",
        "#b6a2f7",
        "rgb(168,168,255)",
        "rgb(200,200,200)",
      ],
      
      tagsColor:{
          "text":"rgb(239, 188, 105)",
          "figure":"rgb(80, 132, 96)",
          "equation":"rgb(205, 94, 104)",
          "code block":"rgb(105, 23, 170)",
      },
      marge: {
        top: 6,
        right: 10,
        bottom: 16,
        left: 6,
      },
      videoDur:672,
      barType: "Teaching",
    };
  },
  watch: {
    playOrPause(val) {
      console.log(val);
      this.showGraph = !val;
      this.showExternal = !val;
      this.$bus.$emit("showGraph", this.showGraph);
      this.$bus.$emit('tagsColor',this.tagsColor);
      this.$bus.$emit("videoDurs", this.videoDur);
      this.$bus.$emit("showExternal", this.showExternal);
    },
    toolState(val) {
      if (val == 'edit')
        this.showEdit = true;
      else
        this.showEdit = false;
    },
    selectEnt(val) {
      this.selectEntId = val;
    },
    timeDur(val) {
      console.log("s", val)
    },
    cube_data() {
      this.$nextTick(() => { });
    },
    cluData() {
      this.$nextTick(() => {
      });
    },
  },
  methods: {
    getData() {
      const _this = this;
      let data = [];
      this.$http
        .post("/api/ent/getData", {}, {})
        .then((response) => {
          _this.entData = response.body;
          _this.$bus.$emit("entData", _this.entData);
        });
      this.$http
        .post("/api/rel/getData", {}, {})
        .then((response) => {
          _this.relData = response.body;
          _this.$bus.$emit("relData", _this.relData);
        });
    },
    getSelectEnt(val) {
      this.selectEntId = val;
    },
    getTimeDur(value) {
      this.timeDur = value
    },
    getToolState(val) {
      this.toolState = val;
    },
    getVideoTime(value) {
      this.videoTime = value
    },
    getShowLabelState(value) {
      this.showLabelState = value
    },

    clickHandler() {
    },
  },
  created: function () {
    var _this = this;
  },
  mounted() {
    const _this = this;
    this.$el.style.setProperty("--heightStyle", this.windowHeight + "px");
    this.showVideo = true;

    this.$bus.$on('playOrPause', (val) => {
      _this.playOrPause = val;
    });
    this.$bus.$emit('videoTotalDur',_this.videoDur);
    this.$bus.$emit('tagsColor',_this.tagsColor);
    this.$bus.$on('toolState', (val) => {
      _this.toolState = val;
    });
    // this.getData();
  },
  beforeDestroy() {
    clearTimeout(this.timer);
  }
};
</script>

<style>
@import '../../assets/style/home.css';
</style>