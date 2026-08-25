import React, { useState } from 'react';
import {
  Gamepad2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';

const EMPTY_FORM = {
  id: '',
  name: '',
  label: '',
};

const GAME_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export default function MinigameRegistryManager({
  baseGames,
  registeredGames,
  notify,
  onDelete,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId('');
  };

  const handleEdit = (game) => {
    setEditingId(game.id);
    setForm({
      id: game.id,
      name: game.name,
      label: game.label,
    });
  };

  const verifyGameFile = async (id) => {
    const href = `/minigame/${id}/index.html`;
    let response = await fetch(href, {
      method: 'HEAD',
      cache: 'no-store',
    });
    if (response.status === 405) {
      response = await fetch(href, { cache: 'no-store' });
    }
    if (!response.ok) {
      throw new Error('GAME_FILE_NOT_FOUND');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextGame = {
      id: form.id.trim().toLowerCase(),
      name: form.name.trim(),
      label: form.label.trim(),
    };

    if (!GAME_ID_PATTERN.test(nextGame.id)) {
      notify('ID는 영문 소문자, 숫자, -, _만 사용할 수 있습니다.', 'error');
      return;
    }
    if (!nextGame.name || !nextGame.label) {
      notify('게임 이름과 리더보드 칭호를 모두 입력하세요.', 'error');
      return;
    }
    if (
      !editingId &&
      (baseGames.some((game) => game.id === nextGame.id) ||
        registeredGames.some((game) => game.id === nextGame.id))
    ) {
      notify('이미 등록된 게임 ID입니다.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await verifyGameFile(nextGame.id);
      await onSave(nextGame);
      resetForm();
    } catch (error) {
      if (error.message === 'GAME_FILE_NOT_FOUND') {
        notify(
          `/public/minigame/${nextGame.id}/index.html 파일을 먼저 배포하세요.`,
          'error'
        );
      } else {
        notify('게임 파일 확인 또는 등록에 실패했습니다.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (game) => {
    if (
      !window.confirm(
        `${game.name} 등록을 삭제할까요?\n게임 파일과 기존 리더보드 기록은 삭제되지 않습니다.`
      )
    ) {
      return;
    }
    await onDelete(game);
    if (editingId === game.id) resetForm();
  };

  return (
    <div className="space-y-6">
      <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] border shadow-sm space-y-5">
        <div className="border-b pb-4">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Gamepad2 className="theme-text" size={21} />
            미니게임 등록
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-5">
            <code>public/minigame/ID/index.html</code>을 먼저 배포한 다음
            등록하세요. 단일 리더보드는
            <code className="ml-1">
              artifacts/ID/public/data/leaderboard
            </code>
            경로로 자동 연결됩니다.
          </p>
          <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3 leading-5">
            게임을 등록하거나 삭제하면 요일 배치가 즉시 다시 계산됩니다.
            가능하면 이용자가 적은 시간에 변경하세요.
          </p>
        </div>

        <form
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          onSubmit={handleSubmit}
        >
          <label className="space-y-1.5">
            <span className="text-[11px] font-black text-slate-500">
              ID (폴더명)
            </span>
            <input
              value={form.id}
              readOnly={Boolean(editingId)}
              maxLength={40}
              placeholder="예: newgame"
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  id: event.target.value.toLowerCase(),
                }))
              }
              className="w-full p-3 rounded-xl border bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 read-only:text-slate-400"
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-black text-slate-500">
              NAME (게시판 표시명)
            </span>
            <input
              value={form.name}
              maxLength={40}
              placeholder="예: 🎮 새 게임"
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              className="w-full p-3 rounded-xl border bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[11px] font-black text-slate-500">
              LABEL (1위 칭호)
            </span>
            <input
              value={form.label}
              maxLength={20}
              placeholder="예: 새게임왕"
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  label: event.target.value,
                }))
              }
              className="w-full p-3 rounded-xl border bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </label>

          <div className="md:col-span-3 flex flex-col sm:flex-row gap-2 justify-end">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-black flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} /> 수정 취소
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl theme-bg text-white text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus size={14} />
              {isSaving
                ? '파일 확인 중...'
                : editingId
                  ? '게임 정보 수정'
                  : '새 게임 등록'}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
          <h2 className="text-lg font-black text-slate-800">
            관리자 등록 게임 ({registeredGames.length})
          </h2>
          <span className="text-[11px] font-bold text-slate-400">
            기본 게임 {baseGames.length}개는 코드에서 계속 유지됩니다.
          </span>
        </div>

        {registeredGames.length === 0 ? (
          <p className="text-center text-slate-400 text-xs py-10 border-2 border-dashed rounded-2xl font-bold">
            관리자 화면에서 추가한 게임이 없습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {registeredGames.map((game) => (
              <div
                key={game.id}
                className="border bg-slate-50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-black text-slate-800 truncate">
                    {game.name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 break-all">
                    ID: {game.id} · 칭호: {game.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 break-all">
                    artifacts/{game.id}/public/data/leaderboard
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(game)}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white border text-slate-600 text-xs font-black flex items-center justify-center gap-1.5"
                  >
                    <Pencil size={13} /> 수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(game)}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-xs font-black flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} /> 등록 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
