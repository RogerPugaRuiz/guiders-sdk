# Story 4.2: Implementar ChatListView con Preact

**Epic:** Epic 4 — Features secundarias — Quick Actions y Chat List View  
**Status:** Done  
**Depends on:** Story 4.1  
**Implements:** FR6, FR11

---

## User Story

Como desarrollador del SDK,
quiero que la vista de lista de conversaciones funcione con Preact,
para que el cambio entre conversaciones sea reactivo y el código sea mantenible.

---

## Acceptance Criteria

**Given** que `isShowingChatListSignal.value` es `true`  
**When** `ChatWidget` se renderiza  
**Then** muestra `ChatListView` en lugar de `ChatMessages` + `ChatInput`

**Given** que `isShowingChatListSignal.value` es `false`  
**When** `ChatWidget` se renderiza  
**Then** muestra `ChatMessages` + `ChatInput`

**Given** `ChatListView` con la lista de conversaciones cargada  
**When** el visitante hace click en una conversación  
**Then** se llama `onChatSwitch(chatId)` del bridge

**Given** que el visitante hace click en "Nueva conversación"  
**When** el evento se dispara  
**Then** se llama `onNewChatRequest()` del bridge

**Given** que la lista está cargando  
**When** `ChatListView` se renderiza  
**Then** muestra un indicador de carga

**Given** que `ChatUIBridge.showChatListView()` se llama  
**When** se ejecuta  
**Then** `isShowingChatListSignal.value = true` y `ChatWidget` muestra la lista

**Given** que `ChatUIBridge.updateSelectedChat(chatId)` se llama  
**When** se ejecuta  
**Then** `chatIdSignal.value` se actualiza y `ChatListView` resalta la conversación activa

---

## Technical Notes

### `ChatWidget.tsx` — conditional rendering
```tsx
export function ChatWidget({ options, callbacks }: ChatWidgetProps) {
  const isShowingList = isShowingChatListSignal.value;

  return (
    <div class="guiders-chat">
      <ChatHeader options={options} onClose={callbacks.onClose} />
      {isShowingList
        ? <ChatListView onChatSwitch={callbacks.onChatSwitch} onNewChat={callbacks.onNewChatRequest} />
        : (
          <>
            <ChatMessages />
            <ChatInput onSend={callbacks.onSend} />
          </>
        )
      }
    </div>
  );
}
```

### `ChatListView.tsx`
```tsx
interface ChatListViewProps {
  onChatSwitch: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatListView({ onChatSwitch, onNewChat }: ChatListViewProps) {
  const { chats, isLoading } = useChatList();
  const activeChatId = chatIdSignal.value;

  if (isLoading) return <LoadingIndicator />;

  return (
    <div class="guiders-chat-list">
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isSelected={chat.id === activeChatId}
          onClick={() => onChatSwitch(chat.id)}
        />
      ))}
      <button class="guiders-new-chat-btn" onClick={onNewChat}>
        Nueva conversación
      </button>
    </div>
  );
}
```

### `hooks/useChatList.ts`
```typescript
export function useChatList() {
  const [chats, setChats] = useState<ChatListV2[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const isShowing = isShowingChatListSignal.value;
    if (!isShowing) return;

    setIsLoading(true);
    ChatV2Service.getInstance()
      .getVisitorChats()
      .then(setChats)
      .finally(() => setIsLoading(false));
  }, [isShowingChatListSignal.value]);

  return { chats, isLoading };
}
```

### `ChatUIBridge` integration
```typescript
showChatListView(): void {
  isShowingChatListSignal.value = true;
}

hideChatListView(): void {
  isShowingChatListSignal.value = false;
}

updateSelectedChat(chatId: string): void {
  chatIdSignal.value = chatId;
}
```

---

## Files to Create
- `src/presentation/components/ChatListView/ChatListView.tsx`
- `src/presentation/components/ChatListView/ChatListItem.tsx`
- `src/presentation/components/ChatListView/ChatListView.styles.ts`
- `src/presentation/components/ChatListView/index.ts`
- `src/presentation/hooks/useChatList.ts`

## Files to Modify
- `src/presentation/components/ChatWidget/ChatWidget.tsx` — conditional rendering
- `src/presentation/bridge/ChatUIBridge.ts` — migrar métodos de chat list

## Definition of Done
- [ ] `ChatListView` se muestra cuando `isShowingChatListSignal.value` es `true`
- [ ] `ChatMessages` + `ChatInput` se muestran cuando `isShowingChatListSignal.value` es `false`
- [ ] Click en conversación llama `onChatSwitch`
- [ ] Click en "Nueva conversación" llama `onNewChatRequest`
- [ ] Indicador de carga mientras `useChatList` está fetching
- [ ] Conversación activa resaltada según `chatIdSignal`
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit --strict` sin errores
- [ ] Tests E2E pasan
