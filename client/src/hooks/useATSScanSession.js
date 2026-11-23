import { useCallback, useEffect, useRef, useState } from "react";

const sessionPrefix = "ats-scan-v1:";
const storeName = "attachments";
const attachmentRetentionMs = 24 * 60 * 60 * 1000;
const defaultState = {
  jobDescription: "",
  selectedResume: null,
  attachment: null,
  completedScan: null,
  showInputs: false,
  showAllImprovements: false,
  expandedSections: { recommendations: true, strengths: true, keywords: true },
};
const memorySessions = new Map();
let databasePromise;

function readSession(key) {
  if (memorySessions.has(key)) return memorySessions.get(key);
  try {
    return { ...defaultState, ...JSON.parse(sessionStorage.getItem(key)) };
  } catch {
    return defaultState;
  }
}

function openAttachmentStore() {
  databasePromise ||= new Promise((resolve, reject) => {
    const request = indexedDB.open("smartnshine-ats", 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch((error) => {
    databasePromise = undefined;
    throw error;
  });
  return databasePromise;
}

async function runAttachmentTransaction(mode, operation) {
  const database = await openAttachmentStore();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = operation(transaction.objectStore(storeName));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function storeAttachment(id, file) {
  await runAttachmentTransaction("readwrite", (store) => {
    const now = Date.now();
    const cursorRequest = store.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      if (now - cursor.value.savedAt > attachmentRetentionMs) cursor.delete();
      cursor.continue();
    };
    return store.put({ file, savedAt: now }, id);
  });
}

export function useATSScanSession(owner) {
  const key = sessionPrefix + owner;
  const [state, setState] = useState(() => readSession(key));
  const current = useRef(state);
  const [fileEntry, setFileEntry] = useState(null);
  const [missingAttachmentId, setMissingAttachmentId] = useState(null);
  const attachmentId = state.attachment?.id;
  const uploadedFile = fileEntry?.id === attachmentId ? fileEntry?.file : null;

  const update = useCallback((changes) => {
    const next = {
      ...current.current,
      ...(typeof changes === "function" ? changes(current.current) : changes),
    };
    current.current = next;
    setState(next);
    try {
      sessionStorage.setItem(key, JSON.stringify(next));
      memorySessions.delete(key);
    } catch {
      memorySessions.set(key, next);
    }
  }, [key]);

  useEffect(() => {
    if (!attachmentId || uploadedFile) return;
    let active = true;
    runAttachmentTransaction("readonly", (store) => store.get(attachmentId))
      .then((record) => {
        if (!active) return;
        if (record?.file) setFileEntry({ id: attachmentId, file: record.file });
        else setMissingAttachmentId(attachmentId);
      })
      .catch(() => {
        if (active) setMissingAttachmentId(attachmentId);
      });
    return () => { active = false; };
  }, [attachmentId, uploadedFile]);

  const setSource = (selectedResume, file = null) => {
    const previousId = current.current.attachment?.id;
    const attachment = file
      ? { id: crypto.getRandomValues(new Uint32Array(4)).join("-"), name: file.name }
      : null;
    setFileEntry(attachment ? { id: attachment.id, file } : null);
    update({ selectedResume, attachment });
    if (attachment) storeAttachment(attachment.id, file).catch(() => {});
    if (previousId) runAttachmentTransaction("readwrite", (store) => store.delete(previousId)).catch(() => {});
  };

  return {
    state,
    update,
    setSource,
    uploadedFile,
    missingAttachment: Boolean(attachmentId && attachmentId === missingAttachmentId),
  };
}
