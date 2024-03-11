<template>
    <div class="chat-window">
        <!-- 显示聊天消息的容器 -->
        <div class="message-container">
            <div v-for="message in messages" :key="message.id" class="message">
                <div v-if="message.isMe" class="isMe">
                    <el-card class="box-card">
                        <div slot="header" class="clearfix">
                            <span class="isMeText"><el-avatar> user </el-avatar></span>
                            <!-- <span v-else><el-avatar icon="el-icon-user-solid"></el-avatar>GPT</span> -->
                            <el-button style="float: right; padding: 3px 0" type="text"></el-button>
                        </div>
                        <div>{{ message.text }}</div>
                    </el-card>
                </div>
                <div v-else class="notMe">
                    <el-card class="box-card">
                        <div slot="header" class="clearfix">
                            <!-- <span class="isMe"><el-avatar> user </el-avatar></span> -->
                            <span><el-avatar icon="el-icon-user-solid"></el-avatar>GPT</span>
                            <el-button style="float: right; padding: 3px 0" type="text"></el-button>
                        </div>
                        <div>{{ message.text }}</div>
                    </el-card>
                </div>
            </div>
        </div>
        <!-- 输入消息的表单 -->
        <form @submit.prevent="sendMessage" class="input-form">
            <input v-model="inputText" type="text" placeholder="输入消息" />
            <button type="submit">发送</button>
        </form>
    </div>
</template>

<script>
export default {
    data() {
        return {
            inputText: '',
            messages: [
                { id: 1, text: '你好', isMe: false },
                { id: 2, text: 'Hi', isMe: true },
            ],
        };
    },
    methods: {
        sendMessage() {
            if (this.inputText.trim()) {
                this.messages.push({ id: Date.now(), text: this.inputText, isMe: true });
                this.inputText = '';
            }
        },
    },
};
</script>

<style scoped>
.isMe {
    width: 90%;
    float: right;
    margin: 15px 0px;
}

.isMeText {
    float: right;
}

.notMe {
    width: 90%;
    float: left;
    margin: 15px 0px;
}

.chat-window {
    max-width: 400px;
    margin: 0 auto;
    overflow: hidden;
    overflow-y: auto;
    height: 100%;
    scrollbar-width: none;
}

.message-container {
    margin-bottom: 10px;
}

.message {
    padding: 5px;
    margin-bottom: 5px;
}

.message-text {
    padding: 10px;
    border-radius: 5px;
}

.mine {
    background-color: lightblue;
}
</style>