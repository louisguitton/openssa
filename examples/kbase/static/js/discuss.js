class DiscussEventHandlers {
    conversation = [
        // { "role": "system", "content": "You are a domain expert in semiconductor." }
    ];

    _updateChatbox(sysmsgs) {
        let roleLabels = {
            "system": "SYSTEM",
            "user":	"USER",
            "assistant": "SSM"
        };

        var chatbox = document.getElementById("chatbox");
        chatbox.innerHTML = this.conversation.map(msg => `<div class="${roleLabels[msg.role]}">${roleLabels[msg.role]}: ${msg.content}</div>`).join("");
        chatbox.scrollTop = chatbox.scrollHeight;

        var syslog = document.getElementById("syslog");
        syslog.innerHTML += sysmsgs.map(msg => `<div>${msg}</div>`).join("");
        syslog.scrollTop = chatbox.scrollHeight;
    }

    sendChat = (e) => {
        if (e.key === "Enter") {

            // Show the spinner
            document.getElementById("loading").classList.remove("d-none");

            const userMessage = e.target.value;
            this.conversation.push({ "role": "user", "content": userMessage });

            const TIMEOUT = 10000; // Timeout after 10 seconds
            const controller = new AbortController();
            // const id = setTimeout(() => controller.abort(), TIMEOUT);
            setTimeout(() => controller.abort(), TIMEOUT);

            // Get model name from the dropdown
            let selected_model = document.getElementById("models").value;

            // Send the conversation to the backend
            fetch("/discuss", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                signal: controller.signal,
                body: JSON.stringify({
                    "model": selected_model,
                    "message": userMessage
                })
            })
            .then(response => {
                if (!response.ok) {
                    var errMsg = `<span style="color:red;">HTTP error status: ${response.status}</span>`; 
                    this.conversation.push({ "role": "system", "content": errMsg });
                    this._updateChatbox([errMsg]);
                }
                return response.json();
            })
            .then(data => {
                // Append the assistant's response to the conversation
                this.conversation.push({ "role": "assistant", "content": data.choices[0].message.content });
                this._updateChatbox(data.choices[0].syslog);

                // Hide the spinner
                document.getElementById("loading").classList.add("d-none");
            })
            .catch(error => {
                if (error.name === "AbortError") {
                    // Timeout occurred
                    var errMsg = `<span style="color:red;">Sorry, I'm taking too long to respond. Please try again.</span>`;
                    this.conversation.push({ "role": "system", "content": errMsg });
                    this._updateChatbox([errMsg]);
                }

                // Hide the spinner
                document.getElementById("loading").classList.add("d-none");
            });

            // Clear the input box for the next message
            e.target.value = "";
            e.preventDefault();
        }
    }

    appendMessage = (e) => { // eslint-disable-line no-unused-vars
        if (e.key === "Enter") {
            // Prevent the default form submission that occurs when enter is pressed
            e.preventDefault();
        
            // Get the current text of the chatbox and the input box
            let chatbox = document.getElementById("chatbox");
        
            // Append the text from the input box to the chatbox, followed by a newline
            chatbox.value += e.target.value + "\n";
        }
    }
}

const eh = new DiscussEventHandlers();
document.getElementById("inputbox").addEventListener("keydown", eh.appendMessage);
document.getElementById("inputbox").addEventListener("keydown", eh.sendChat);