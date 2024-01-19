"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MirrorClient = void 0;
const discord_js_selfbot_v13_1 = require("discord.js-selfbot-v13");
const utils_1 = require("./utils");
const mirror_1 = require("./mirror");
class MirrorClient extends discord_js_selfbot_v13_1.Client {
    constructor(config) {
        super({ checkUpdate: false });
        this.mirrorChannels = new Map();
        this.config = config;
        this.loadMirrors();
        this.on("ready", () => this.onReady());
        this.on("messageCreate", message => this.onMessageCreate(message));
        this.on("messageUpdate", (oldMessage, newMessage) => this.onMessageUpdate(oldMessage, newMessage));
    }
    onReady() {
        var _a;
        this.user.setStatus(this.config.getStatus());
        console.log(`${(_a = this.user) === null || _a === void 0 ? void 0 : _a.username} is now mirroring >:)!`);
    }
    onMessageCreate(message) {
        this.mirrorMessage(message);
    }
    onMessageUpdate(_oldMessage, newMessage) {
        if (!newMessage.partial) {
            this.mirrorMessage(newMessage, true);
        }
    }
    mirrorMessage(message, isUpdate = false) {
        if (!this.isMirrorableMessage(message)) {
            return;
        }
        const mirror = this.mirrorChannels.get(message.channelId);
        if (!mirror) {
            return;
        }
        if (!mirror.shouldMirror(message, isUpdate)) {
            return;
        }
        try {
            mirror.applyReplacements(message);
        }
        catch (error) {
            console.log(error);
        }
        mirror.dispatchMessage(message, () => this.logMirroredMessage(message));
    }
    isMirrorableMessage(message) {
        return (!(0, utils_1.isSystemMessage)(message) && !(0, utils_1.isDirectMessage)(message) &&
            !(0, utils_1.isVisibleOnlyByClient)(message) && !(0, utils_1.isEmptyMessage)(message) &&
            !(0, utils_1.isPublishedMessage)(message));
    }
    logMirroredMessage(message) {
        var _a, _b;
        const logMessage = this.config.getLogMessage();
        if (!logMessage.length) {
            return;
        }
        console.log(logMessage
            .replace("%date%", new Date().toLocaleString())
            .replace("%author%", (_b = (_a = message === null || message === void 0 ? void 0 : message.author) === null || _a === void 0 ? void 0 : _a.username) !== null && _b !== void 0 ? _b : "unknown")
            .replace("%server%", message.guild.name)
            .replace("%channel%", message.channel.name));
    }
    loadMirrors() {
        for (const mirrorConfig of this.config.getMirrors()) {
            this.loadMirror(mirrorConfig);
        }
    }
    loadMirror(mirrorConfig) {
        const channelIds = mirrorConfig.channelIds;
        if (!channelIds) {
            return;
        }
        const mirror = new mirror_1.Mirror(mirrorConfig);
        for (const channelId of channelIds) {
            this.mirrorChannels.set(channelId, mirror);
        }
    }
}
exports.MirrorClient = MirrorClient;
