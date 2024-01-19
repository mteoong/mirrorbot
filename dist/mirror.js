"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mirror = void 0;
const discord_js_selfbot_v13_1 = require("discord.js-selfbot-v13");
const utils_1 = require("./utils");
const replacements_1 = require("./replacements");
class MirrorRequirements {
    constructor({ minEmbedsCount = 0, minContentLength = 0, minAttachmentsCount = 0 }) {
        this.minEmbedsCount = minEmbedsCount;
        this.minContentLength = minContentLength;
        this.minAttachmentsCount = minAttachmentsCount;
    }
}
class MirrorOptions {
    constructor({ useWebhookProfile = false, removeAttachments = false, mirrorMessagesFromBots = true, mirrorReplyMessages = true, mirrorMessagesOnEdit = false }) {
        this.useWebhookProfile = useWebhookProfile;
        this.removeAttachments = removeAttachments;
        this.mirrorMessagesFromBots = mirrorMessagesFromBots;
        this.mirrorReplyMessages = mirrorReplyMessages;
        this.mirrorMessagesOnEdit = mirrorMessagesOnEdit;
    }
}
class Mirror {
    constructor({ webhookUrls = [], ignoredUserIds = undefined, ignoredRoleIds = [], requirements = {}, options = {}, replacements = {} }) {
        this.webhooks = [];
        this.loadWebhooks(webhookUrls);
        this.ignoredUserIds = new Set(ignoredUserIds);
        this.ignoredRoleIds = ignoredRoleIds;
        this.mirrorRequirements = new MirrorRequirements(requirements);
        this.mirrorOptions = new MirrorOptions(options);
        this.replacements = new replacements_1.MirrorReplacements(replacements);
    }
    shouldMirror(message, isUpdate) {
        return (this.messageMeetsOptions(message, isUpdate) &&
            this.messageMeetsRequirements(message) &&
            this.stripMessage(message));
    }
    applyReplacements(message) {
        this.replacements.apply(message);
    }
    dispatchMessage(message, callback) {
        const payloads = this.createMessagePayloads(message);
        for (const webhook of this.webhooks) {
            for (const payload of payloads) {
                webhook
                    .send(payload)
                    .then(() => callback(message))
                    .catch(error => console.log(error));
            }
        }
    }
    createMessagePayloads(message) {
        var _a, _b, _c;
        const payloads = [];
        const payload = {
            files: [...message.attachments.values()],
            embeds: message.embeds
        };
        const maxContentLength = 2000;
        if (message.content.length) {
            payload.content = message.content.substring(0, maxContentLength);
        }
        if (!this.mirrorOptions.useWebhookProfile) {
            payload.username = message.author.username;
            payload.avatarURL = (_b = (_a = message.author) === null || _a === void 0 ? void 0 : _a.avatarURL()) !== null && _b !== void 0 ? _b : undefined;
        }
        payloads.push(payload);
        for (let i = 0; i < Math.floor(message.content.length / maxContentLength); i++) {
            const payload = {
                content: message.content.substring((i + 1) * maxContentLength, (i + 2) * maxContentLength)
            };
            if (!this.mirrorOptions.useWebhookProfile) {
                payload.username = message.author.username;
                payload.avatarURL = (_c = message.author.avatarURL()) !== null && _c !== void 0 ? _c : undefined;
            }
            payloads.push(payload);
        }
        return payloads;
    }
    messageMeetsOptions(message, isUpdate) {
        return ((this.mirrorOptions.mirrorMessagesFromBots || message.author.bot) &&
            (this.mirrorOptions.mirrorReplyMessages || message.reference == null) &&
            (this.mirrorOptions.mirrorMessagesOnEdit || !isUpdate));
    }
    messageMeetsRequirements(message) {
        return (message.content.length >= this.mirrorRequirements.minContentLength &&
            message.embeds.length >= this.mirrorRequirements.minEmbedsCount &&
            message.attachments.size >= this.mirrorRequirements.minAttachmentsCount &&
            !(message.author.id in this.ignoredUserIds) &&
            (message.member == null || !(0, utils_1.memberHasRole)(message.member, ...this.ignoredRoleIds)));
    }
    stripMessage(message) {
        if (this.mirrorOptions.removeAttachments) {
            if ((0, utils_1.containsOnlyAttachments)(message)) {
                return false;
            }
            message.attachments.clear();
        }
        if ((0, utils_1.isGif)(message)) {
            message.embeds.pop();
        }
        return true;
    }
    loadWebhooks(webhookUrls) {
        for (const webhookUrl of webhookUrls) {
            this.webhooks.push(new discord_js_selfbot_v13_1.WebhookClient({ url: webhookUrl }));
        }
    }
}
exports.Mirror = Mirror;
