export class ChatHelper {
  static wasRecentlyTypingByUsername = {};
  static userCount = 1;

  static clearIsTyping(isTypingElement, isTypingContainer, username) {
    if (!this.wasRecentlyTypingByUsername[username]) {
      isTypingContainer.innerHTML = isTypingContainer.innerHTML.replace(
        isTypingElement,
        ""
      );
    } else {
      setTimeout(() => {
        this.clearIsTyping(isTypingElement, isTypingContainer, username);
        this.wasRecentlyTypingByUsername[username] = false;
      }, 2 * 1000);
    }
  }

  static updateIsTyping(
    isTypingElement,
    isTypingContainer,
    typingEvent,
    username
  ) {
    if (isTypingContainer.innerHTML.indexOf(isTypingElement) == -1) {
      this.wasRecentlyTypingByUsername[typingEvent] = false;
      isTypingContainer.innerHTML += isTypingElement;

      setTimeout(() => {
        this.clearIsTyping(isTypingElement, isTypingContainer, username);
      }, 5 * 1000);
    } else {
      this.wasRecentlyTypingByUsername[typingEvent] = true;
    }
  }
  static updateViewerCount(userCount, viewCountDisplay) {
    const friendString = userCount == 1 ? "friend" : "friends";
    viewCountDisplay.textContent = ` ${userCount} ${friendString} watching!`;
  }

  static appendMessage(messageData, chatContainer) {
    chatContainer.innerHTML += this.buildMessageContainerHTML(messageData);
  }

  static buildMessageContainerHTML(messageData) {
    return `<div id="message-${
      messageData.id
    }" class="rounded flex-vertical whitney theme-dark">
      <div class="rounded chat flex-vertical flex-spacer">
          <div class="rounded content flex-spacer flex-horizontal">
              <div class="rounded flex-spacer flex-vertical messages-wrapper">
                  <div class="scroller-wrap">
                      <div class="scroller messages">
                          <div class="message-group hide-overflow">
                              <!--
                              <div class="avatar-large animate" style="background-image: url(https://cdn.discordapp.com/embed/avatars/0.png)"></div>
                              -->
                              <div class="comment">${this.buildMessageHTML(
                                messageData
                              )}</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>`;
  }

  static buildMessageHTML(messageData) {
    return `<div class="message first">
          <h2 style="line-height: 16px;">
              <span class="username-wrapper v-btm">
                  <strong class="user-name">${messageData.username}</strong>
              </span>
              <span class="highlight-separator"> - </span>
              <span class="timestamp">${this.toTimestamp(
                new Date(messageData.createdAt)
              )}</span>
          </h2>
          <div innerHtml="processed" class="message-text">${
            messageData.html
          }</div>
      </div>
      ${
        messageData.embed
          ? `<div class="embed">
          <a class="title" href="${messageData.url}">${
              messageData.embed.title
            }</a>
          <div class="description">${messageData.embed.description}</div>
          ${
            messageData.embed.image && !messageData.embed.video
              ? `<img src="${messageData.embed.image}" onerror="this.onerror=null;this.hidden = true">`
              : ""
          }
        </div>`
          : ``
      }`;
  }

  static toTimestamp(date) {
    const timestamp = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
      minute: "numeric",
    });

    const wasToday = new Date().getDay() / date.getDay() === 1;
    const wasYesterday = new Date().getDate() % date.getDate() === 1;
    const isTomorrow = date.getTime() % new Date().getDate() === 1;

    if (wasToday || wasYesterday) return `Today at ${timestamp}`;
    if (wasYesterday) return `Yesterday at ${timestamp}`;
    else if (isTomorrow) return `Tomorrow at ${timestamp}`;

    return date.toJSON().slice(0, 10).split("-").reverse().join("/");
  }
}
