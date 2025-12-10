import FirebaseAction from "./firebase/action.js";

// Initialize FirebaseAction for comment and msgPossibility
const commentAction = new FirebaseAction("comment");
const msgPossibilityAction = new FirebaseAction("msgPossibility");

console.log("test");

// Temporarily set ID → To be changed later
let current_id = null;

export function setCurrentId(id) {
  current_id = id;
  console.log("Changed Current ID in main.js set to:", current_id);
};

export function getCurrentId() {
  return current_id;
};


// Check msgPossibility status and set button state
async function checkMsgPossibility() {
  const documents = await msgPossibilityAction.findAll();
  if (documents.length > 0) {
    const doc = documents[0];
    const isMsgEnabled = doc.status; 
    
    $("#sending_btn").prop("disabled", !isMsgEnabled);

    if (!isMsgEnabled) {
      alert("메시지 보내기 기능이 비활성화되었습니다.");
    }
  } else {
    console.error("No msgPossibility document found.");
  }
};

// Send message
$("#sending_btn").click(async function (event) {
  event.preventDefault();

  let sender_id = current_id;
  let msg = $('#sending_msg').val();
  let receiver_id = $('#receiver_id').val();
  let utcTimestamp = new Date().toISOString();

  console.log("보내는 사람의 current_id: ", current_id);

  if (!receiver_id) {
    alert("수신자 ID를 입력해 주세요.");
    return;
  }
  
  if (!msg) {
    alert("메시지를 입력해 주세요.");
    return;
  }

  const doc = {
    'sender_id': sender_id,
    'msg': msg,
    'receiver_id': receiver_id,
    'date': utcTimestamp  // UTC 시간 추가
  };

  await commentAction.save(doc);
  alert("전송되었습니다.");
  
  // 전송 후 입력창 비우기 (사용자 경험 개선)
  $('#sending_msg').val('');
  // 내 화면의 전송창 텍스트도 비우기 위해 트리거 (선택사항)
  // document.getElementById('screen_display').textContent = ''; 
});

// Load comments function
function scrollToBottom() {
    const receivedMsgDiv = document.getElementById("received_msg");
    if(receivedMsgDiv) {
        receivedMsgDiv.scrollTop = receivedMsgDiv.scrollHeight;
    }
}

export async function renderComments() {
  if (!current_id) {
    console.error("current_id is not set!");
    return;
  }

  let str = "";

  const data = await commentAction.findBy("receiver_id", current_id);
  console.log("current_id:", current_id, "updated data: ", data);

  // 시간순 정렬 (과거 -> 최신 순으로 정렬해야 스크롤 아래가 최신이 됨. 
  // 기존 코드는 docB - docA로 최신이 위로 오는 구조였음. 채팅처럼 하려면 docA - docB 추천)
  data.sort((docA, docB) => {
    return new Date(docA['date']) - new Date(docB['date']); 
  });

  data.forEach((row) => {
    let msg = row['msg'];
    let sender_id = row['sender_id'];
    let dateStr = "";
    if(row['date']) {
        // 시간 보기 좋게 변환 (선택사항)
        dateStr = new Date(row['date']).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // [중요 수정] padMessage 제거 및 6분할 div 제거 -> 하나의 통 div로 변경
    str += `
    <div class="msg-card" style="margin-bottom: 15px;">
        <div style="font-weight:bold; font-size: 0.9em; margin-bottom: 5px;">
            발신인: ${sender_id} <span style="font-weight:normal; font-size:0.8em; color:#666;">(${dateStr})</span>
        </div>
        <div class="pager-screen">
            <div class="common-display" style="width: 100%; white-space: normal; word-break: break-all; text-align: left; padding: 10px;">
                ${msg}
            </div>
        </div>
    </div>
    `;
  });

  $("#received_msg").html(str);
  scrollToBottom();  // 메시지가 추가되면 자동으로 스크롤
};

// Initial check on page load
$(document).ready(function () {
  checkMsgPossibility(); // Check and set message button enabled/disabled
});

// [삭제] padMessage 함수는 더 이상 필요하지 않아 삭제했습니다.
