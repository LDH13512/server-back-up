import React from 'react';
import { AlertCircle, Lightbulb } from 'lucide-react';

export function CommentActionDialog({
  modal,
  onModalChange,
  onConfirm,
}) {
  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-[2rem] w-full max-w-[340px] text-center shadow-2xl animate-in zoom-in duration-300 border">
        <span className="text-xl font-black mb-1 text-slate-800">
          댓글 본인 인증
        </span>
        <p className="text-xs font-bold text-slate-400 mb-4">
          본인 확인을 위해 닉네임을 정확히 입력하세요.
        </p>
        <input
          type="text"
          autoFocus
          className="w-full p-4 border-2 rounded-2xl outline-none text-center text-lg mb-2 focus:border-orange-400 font-bold"
          placeholder="닉네임 입력"
          value={modal.authorInput}
          onChange={(event) =>
            onModalChange((previous) => ({
              ...previous,
              authorInput: event.target.value,
              error: '',
            }))
          }
        />
        {modal.type === 'edit' && (
          <textarea
            className="w-full p-4 border-2 rounded-2xl outline-none text-sm mb-2 mt-2 h-24 focus:border-blue-400 font-medium resize-y"
            placeholder="수정할 내용"
            value={modal.newContent}
            onChange={(event) =>
              onModalChange((previous) => ({
                ...previous,
                newContent: event.target.value,
                error: '',
              }))
            }
          />
        )}
        <div className="h-4 mb-4">
          {modal.error && (
            <p className="text-orange-500 text-[11px] font-black animate-pulse">
              {modal.error}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() =>
              onModalChange({
                isOpen: false,
                type: '',
                bookingId: '',
                commentId: '',
                authorInput: '',
                newContent: '',
                error: '',
              })
            }
            className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black shadow-xl hover:brightness-105 transition-all"
          >
            인증 실행
          </button>
        </div>
      </div>
    </div>
  );
}

export function LeavePartyDialog({ modal, onModalChange, onConfirm }) {
  if (!modal.isOpen || !modal.targetBooking) return null;

  const selectedParticipant =
    modal.targetBooking.participants[modal.targetParticipantIndex];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-[2rem] w-full max-w-[340px] text-center shadow-2xl border">
        <span className="text-xl font-black mb-1 text-slate-800">
          파티 나가기
        </span>
        <p className="text-xs font-bold text-slate-400 mb-4">
          본인 확인을 위해 닉네임을 정확히 입력하세요.
        </p>
        <div className="bg-slate-50 rounded-xl p-3 mb-4 text-sm font-black text-slate-600 border border-slate-200">
          선택한 닉네임:{' '}
          <span className="text-orange-500">{selectedParticipant}</span>
        </div>
        <input
          type="text"
          autoFocus
          className="w-full p-4 border-2 rounded-2xl outline-none text-center text-lg focus:border-orange-400 mb-2 font-bold"
          placeholder="닉네임 입력"
          value={modal.inputNickname}
          onChange={(event) =>
            onModalChange({
              ...modal,
              inputNickname: event.target.value,
              error: '',
            })
          }
        />
        <div className="h-4 mb-4">
          {modal.error && (
            <p className="text-orange-500 text-[11px] font-black animate-pulse">
              {modal.error}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onModalChange({ isOpen: false })}
            className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-400"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black shadow-xl hover:brightness-105 transition-all"
          >
            나가기
          </button>
        </div>
      </div>
    </div>
  );
}

export function SecurityDialog({ modal, onModalChange, onConfirm }) {
  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl border">
        <span className="text-xl font-black mb-1 text-slate-800 block">
          방 비밀번호 확인
        </span>
        <p className="text-xs font-bold text-slate-400 mb-4">
          파티 생성 시 설정한 비밀번호를 기입하세요.
        </p>
        <input
          type="password"
          autoFocus
          className="w-full p-4 border-2 rounded-2xl outline-none text-center text-xl tracking-widest focus:theme-border mb-4 font-bold"
          placeholder="••••"
          value={modal.password}
          onChange={(event) =>
            onModalChange((previous) => ({
              ...previous,
              password: event.target.value,
              error: '',
            }))
          }
        />
        {modal.error && (
          <p className="text-orange-500 text-[11px] font-black mb-4">
            {modal.error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => onModalChange({ isOpen: false })}
            className="flex-1 py-3 bg-slate-100 rounded-2xl font-black text-slate-400"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 theme-bg text-white rounded-2xl font-black shadow-xl"
          >
            인증 완료
          </button>
        </div>
      </div>
    </div>
  );
}

export function SuggestionDialog({ modal, onModalChange, onSubmit }) {
  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in duration-300 border text-center">
        <span className="text-lg font-black mb-1 text-slate-800 flex items-center justify-center gap-2">
          <Lightbulb className="text-amber-500" size={20} /> 이 기능을
          만들어주세요!
        </span>
        <p className="text-[11px] font-bold text-slate-400 mb-4">
          필요한 기능이나 개선점을 자유롭게 적어주세요.
        </p>
        <div className="flex gap-2 items-center mb-3">
          <input
            type="text"
            placeholder="닉네임"
            disabled={modal.isAnonymous}
            className="flex-1 p-2.5 border-2 rounded-xl text-xs font-bold outline-none focus:border-teal-400 bg-slate-50 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
            value={modal.isAnonymous ? '익명' : modal.nickname}
            onChange={(event) =>
              onModalChange((previous) => ({
                ...previous,
                nickname: event.target.value,
              }))
            }
          />
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-500 whitespace-nowrap select-none">
            <input
              type="checkbox"
              checked={modal.isAnonymous}
              onChange={(event) =>
                onModalChange((previous) => ({
                  ...previous,
                  isAnonymous: event.target.checked,
                }))
              }
              className="accent-[#008081] w-4 h-4 rounded"
            />
            <span>익명</span>
          </label>
        </div>
        <textarea
          className="w-full p-3 border-2 rounded-xl text-xs mb-4 focus:border-teal-400 font-medium resize-y h-24 bg-slate-50 shadow-inner"
          placeholder="여기에 입력하세요..."
          value={modal.text}
          onChange={(event) =>
            onModalChange((previous) => ({
              ...previous,
              text: event.target.value,
            }))
          }
        />
        <div className="flex gap-2">
          <button
            onClick={() =>
              onModalChange({
                isOpen: false,
                text: '',
                nickname: '',
                isAnonymous: false,
              })
            }
            className="flex-1 py-3 bg-slate-100 rounded-xl font-black text-xs text-slate-400 hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 py-3 theme-bg text-white rounded-xl font-black text-xs shadow-md hover:brightness-105 transition-all"
          >
            보내기
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteAllDataDialog({ modal, onModalChange, onConfirm }) {
  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl animate-in zoom-in duration-300 border-2 border-rose-200">
        <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="text-rose-600" size={32} />
        </div>
        <span className="text-xl font-black mb-2 text-rose-600">
          모든 데이터 지우기
        </span>
        <p className="text-xs font-bold text-slate-500 mb-6">
          정말 모든 데이터를 삭제하시겠습니까?
          <br />
          계속하려면 마스터 비밀번호를 입력하세요.
        </p>
        <input
          type="password"
          autoFocus
          className="w-full p-4 border-2 rounded-2xl outline-none text-center text-lg mb-2 focus:border-rose-400 font-bold"
          placeholder="마스터 비밀번호"
          value={modal.password}
          onChange={(event) =>
            onModalChange((previous) => ({
              ...previous,
              password: event.target.value,
              error: '',
            }))
          }
        />
        <div className="h-4 mb-4">
          {modal.error && (
            <p className="text-rose-500 text-[11px] font-black animate-pulse">
              {modal.error}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() =>
              onModalChange({ isOpen: false, password: '', error: '' })
            }
            className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-500 hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl hover:brightness-105 transition-all"
          >
            전체 삭제
          </button>
        </div>
      </div>
    </div>
  );
}

export function DestroyServerDialog({ modal, onModalChange, onConfirm }) {
  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-[2.5rem] w-full max-sm text-center shadow-2xl animate-in zoom-in duration-300 border-2 border-rose-900 text-rose-50">
        <div className="bg-rose-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle
            className="text-rose-600 drop-shadow-[0_0_10px_rgba(225,29,72,0.8)]"
            size={32}
          />
        </div>
        <span className="text-xl font-black mb-2 text-rose-500">
          경고: 서버 폭파
        </span>
        <p className="text-xs font-bold text-rose-200/60 mb-6">
          이 작업은 취소할 수 없으며 사이트가 영구 정지됩니다.
          <br />
          계속하려면 마스터 비밀번호를 입력하세요.
        </p>
        <input
          type="password"
          autoFocus
          className="w-full p-4 border-2 border-rose-900 bg-zinc-900 rounded-2xl outline-none text-center text-lg mb-2 focus:border-rose-500 font-bold text-rose-100 placeholder:text-rose-900/50"
          placeholder="master password"
          value={modal.password}
          onChange={(event) =>
            onModalChange((previous) => ({
              ...previous,
              password: event.target.value,
              error: '',
            }))
          }
        />
        <div className="h-4 mb-4">
          {modal.error && (
            <p className="text-rose-500 text-[11px] font-black animate-pulse">
              {modal.error}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() =>
              onModalChange({ isOpen: false, password: '', error: '' })
            }
            className="flex-1 py-4 bg-zinc-800 rounded-2xl font-black text-rose-200 hover:bg-zinc-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-rose-700 text-white rounded-2xl font-black shadow-[0_0_15px_rgba(225,29,72,0.5)] hover:bg-rose-600 transition-all border border-rose-500"
          >
            폭파하기
          </button>
        </div>
      </div>
    </div>
  );
}

export function FallingItems({ assets, items }) {
  return items.map((item) => {
    const customImage = assets[item.slotIndex];

    return (
      <div
        key={item.id}
        className="falling-character flex items-center justify-center"
        style={{
          left: `${item.left}%`,
          width: `${item.size}px`,
          height: `${item.size}px`,
          animationDelay: `${item.delay}s`,
          '--spin-deg': `${item.spin}deg`,
        }}
      >
        {customImage ? (
          <img
            src={customImage}
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-white/95 border shadow-md flex items-center justify-center text-3xl">
            {item.emoji}
          </div>
        )}
      </div>
    );
  });
}
