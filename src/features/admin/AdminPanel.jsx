import React, { useState } from 'react';
import {
  AlertCircle,
  Download,
  Flag,
  Gamepad2,
  Lightbulb,
  Lock,
  Plus,
  RefreshCcw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import LogTable from '../../components/LogTable';
import MinigameRegistryManager from './MinigameRegistryManager';
import ReportManager from './ReportManager';

const DEFAULT_EMOJIS = ['🧽', '🦆', '🌟', '🐥', '🥰', '🤗', '🌊'];

export default function AdminPanel({
  adminAssets,
  adminBgImage,
  baseMinigames,
  currentLogs,
  importDataTxt,
  isMinigameResetConfirming,
  isResetConfirming,
  isResettingMinigames,
  logPage,
  parsedImportCount,
  passwordData,
  reports,
  notify,
  suggestions,
  registeredMinigames,
  totalLogPages,
  onAssetChange,
  onBackgroundChange,
  onClearLogs,
  onDeleteAllRequest,
  onDeleteSuggestion,
  onDeleteReportedContent,
  onDestroyServerRequest,
  onExit,
  onExport,
  onFileUpload,
  onImportDataChange,
  onImportSubmit,
  onLogPageChange,
  onLogout,
  onMinigameReset,
  onMinigameResetConfirmingChange,
  onMinigameRegistrationDelete,
  onMinigameRegistrationSave,
  onPasswordChange,
  onPasswordSubmit,
  onRemoveReport,
  onResetConfirmingChange,
  onRollback,
  onSaveAssets,
  onSaveBackground,
  onUpdateReportStatus,
}) {
  const [activeSection, setActiveSection] = useState('settings');

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-8">
      <div className="bg-white border shadow-sm rounded-2xl p-2 flex flex-col sm:flex-row gap-2">
        <AdminMenuButton
          active={activeSection === 'settings'}
          icon={<Settings size={16} />}
          label="관리자 설정"
          onClick={() => setActiveSection('settings')}
        />
        <AdminMenuButton
          active={activeSection === 'minigames'}
          icon={<Gamepad2 size={16} />}
          label="미니게임 관리"
          onClick={() => setActiveSection('minigames')}
        />
        <AdminMenuButton
          active={activeSection === 'reports'}
          icon={<Flag size={16} />}
          label="신고 관리"
          onClick={() => setActiveSection('reports')}
        />
        <div className="sm:ml-auto flex gap-2">
          <button
            type="button"
            onClick={onExit}
            className="flex-1 sm:flex-none bg-slate-800 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md hover:bg-slate-700 transition-colors"
          >
            🏠 메인 화면으로 가기
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 sm:flex-none bg-rose-600 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md hover:bg-rose-700 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      {activeSection === 'minigames' ? (
        <MinigameRegistryManager
          baseGames={baseMinigames}
          registeredGames={registeredMinigames}
          notify={notify}
          onDelete={onMinigameRegistrationDelete}
          onSave={onMinigameRegistrationSave}
        />
      ) : activeSection === 'reports' ? (
        <ReportManager
          reports={reports}
          onDeleteContent={onDeleteReportedContent}
          onRemoveReport={onRemoveReport}
          onUpdateStatus={onUpdateReportStatus}
        />
      ) : (
        <>
          <SuggestionList
            suggestions={suggestions}
            onDelete={onDeleteSuggestion}
          />

          <BackupPanel
            importDataTxt={importDataTxt}
            parsedImportCount={parsedImportCount}
            onExport={onExport}
            onFileUpload={onFileUpload}
            onImportDataChange={onImportDataChange}
            onImportSubmit={onImportSubmit}
          />

          <AssetPanel
            assets={adminAssets}
            onAssetChange={onAssetChange}
            onSave={onSaveAssets}
          />

          <BackgroundPanel
            backgroundImage={adminBgImage}
            onBackgroundChange={onBackgroundChange}
            onSave={onSaveBackground}
          />

          <PasswordPanel
            passwordData={passwordData}
            onPasswordChange={onPasswordChange}
            onSubmit={onPasswordSubmit}
          />

          <DangerZone
            isMinigameResetConfirming={isMinigameResetConfirming}
            isResettingMinigames={isResettingMinigames}
            onDeleteAllRequest={onDeleteAllRequest}
            onDestroyServerRequest={onDestroyServerRequest}
            onMinigameReset={onMinigameReset}
            onMinigameResetConfirmingChange={
              onMinigameResetConfirmingChange
            }
          />

          <ActivityLogPanel
            currentLogs={currentLogs}
            isResetConfirming={isResetConfirming}
            logPage={logPage}
            totalLogPages={totalLogPages}
            onClearLogs={onClearLogs}
            onExit={onExit}
            onLogPageChange={onLogPageChange}
            onLogout={onLogout}
            onResetConfirmingChange={onResetConfirmingChange}
            onRollback={onRollback}
          />
        </>
      )}
    </div>
  );
}

function AdminMenuButton({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-colors ${
        active
          ? 'theme-bg text-white shadow'
          : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SuggestionList({ suggestions, onDelete }) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-4">
      <span className="text-lg font-black text-slate-800 flex items-center gap-2 border-b pb-4">
        <Lightbulb className="text-amber-500" size={20} /> 건의 사항 (
        {suggestions.length})
      </span>
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {suggestions.length === 0 ? (
          <p className="text-center text-slate-400 text-xs py-8 italic font-bold border-2 border-dashed rounded-2xl">
            등록된 건의 사항이 없습니다.
          </p>
        ) : (
          suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-4 bg-slate-50 border rounded-2xl relative group"
            >
              <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap pr-8">
                {suggestion.text}
              </p>
              <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 border-t pt-2 border-slate-100">
                <span>작성자: {suggestion.nickname || '익명'}</span>
                <span>
                  {new Date(suggestion.timestamp).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => onDelete(suggestion.id)}
                className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BackupPanel({
  importDataTxt,
  parsedImportCount,
  onExport,
  onFileUpload,
  onImportDataChange,
  onImportSubmit,
}) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-4">
        <span className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Download className="theme-text" size={20} /> 데이터 백업 및 복원
        </span>
        <button
          onClick={onExport}
          className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-700 transition-colors"
        >
          <Download size={14} /> 백업 다운로드 (엑셀/CSV)
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-400">
            데이터 일괄 추가
          </p>
          <label className="cursor-pointer bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-teal-100 transition-all flex items-center gap-1 border border-teal-200">
            <UploadCloud size={12} /> 파일로 불러오기 (엑셀/CSV)
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onFileUpload}
            />
          </label>
        </div>
        <textarea
          className="w-full px-10 py-6 border-2 rounded-2xl outline-none focus:theme-border text-xs bg-slate-50 min-h-[120px] resize-y shadow-inner"
          placeholder="엑셀에서 표 영역을 드래그 후 복사하여 여기에 붙여넣으세요..."
          value={importDataTxt}
          onChange={(event) => onImportDataChange(event.target.value)}
        />
        <button
          disabled={parsedImportCount === 0}
          onClick={onImportSubmit}
          className="w-full py-4 theme-bg text-white rounded-2xl font-black shadow-lg hover:brightness-105 transition-all disabled:opacity-50 disabled:hover:brightness-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <UploadCloud size={16} /> 일괄 추가하기
        </button>
      </div>
    </div>
  );
}

function AssetPanel({ assets, onAssetChange, onSave }) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-4">
        <span className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Sparkles className="theme-text" size={20} /> 이스터에그 캐릭터
          이미지 설정
        </span>
        <span className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-1 rounded-md shadow-sm">
          최대 7개 슬롯 연동
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <AssetSlot
            key={index}
            asset={assets[index]}
            defaultEmoji={DEFAULT_EMOJIS[index]}
            onChange={(image) => onAssetChange(index, image)}
          />
        ))}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="theme-bg text-white p-3 px-6 rounded-xl text-xs font-black shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center gap-1.5"
        >
          <Save size={14} /> 캐릭터 이미지 저장
        </button>
      </div>
    </div>
  );
}

function AssetSlot({ asset, defaultEmoji, onChange }) {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (readerEvent) => onChange(readerEvent.target.result);
    event.target.value = null;
  };

  return (
    <div className="flex flex-col items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl relative group/slot">
      <div className="w-16 h-16 rounded-xl border bg-white flex items-center justify-center overflow-hidden shadow-inner mb-2 relative">
        {asset ? (
          <img src={asset} className="w-full h-full object-contain" />
        ) : (
          <span className="text-2xl select-none">{defaultEmoji}</span>
        )}
      </div>
      <div className="flex gap-1 w-full justify-center">
        <label className="cursor-pointer bg-white border border-slate-200 text-[10px] font-black p-1 px-1.5 rounded hover:bg-slate-100 shadow-sm transition-colors text-slate-600">
          등록
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
}

function BackgroundPanel({
  backgroundImage,
  onBackgroundChange,
  onSave,
}) {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (readerEvent) =>
      onBackgroundChange(readerEvent.target.result);
    event.target.value = null;
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-4">
        <span className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Plus className="theme-text" size={20} /> 이스터에그 배경화면 설정
        </span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
        <div className="w-40 h-24 rounded-xl border bg-white flex items-center justify-center overflow-hidden shadow-cover relative">
          {backgroundImage ? (
            <img
              src={backgroundImage}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-black text-slate-300">
              배경화면 미지정
            </span>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-col">
          <div className="flex gap-2">
            <label className="cursor-pointer bg-teal-600 text-white text-xs font-black p-3 px-5 rounded-xl hover:brightness-105 shadow-md transition-all">
              배경 등록
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>
      </div>
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="theme-bg text-white p-3 px-6 rounded-xl text-xs font-black shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center gap-1.5"
        >
          <Save size={14} /> 배경화면 저장하기
        </button>
      </div>
    </div>
  );
}

function PasswordPanel({ passwordData, onPasswordChange, onSubmit }) {
  const field = (name, placeholder) => (
    <input
      type="password"
      placeholder={placeholder}
      className="w-full p-3 border-2 rounded-xl outline-none focus:border-teal-500 text-sm font-bold bg-slate-50"
      value={passwordData[name]}
      onChange={(event) =>
        onPasswordChange((previous) => ({
          ...previous,
          [name]: event.target.value,
        }))
      }
    />
  );

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-4">
      <span className="text-lg font-black text-slate-800 flex items-center gap-2 border-b pb-4">
        <Lock size={20} /> 비밀번호 설정 (마스터 비밀번호 변경)
      </span>
      <form onSubmit={onSubmit} className="space-y-3">
        {field('current', '현재 비밀번호')}
        {field('new', '새 비밀번호')}
        {field('confirm', '새 비밀번호 확인')}
        <button
          type="submit"
          className="w-full py-3 theme-bg text-white rounded-xl font-black shadow-md hover:brightness-105 active:scale-[0.98] transition-all"
        >
          변경 완료
        </button>
      </form>
    </div>
  );
}

function DangerZone({
  isMinigameResetConfirming,
  isResettingMinigames,
  onDeleteAllRequest,
  onDestroyServerRequest,
  onMinigameReset,
  onMinigameResetConfirmingChange,
}) {
  return (
    <div className="bg-rose-50 p-6 rounded-[2.5rem] border border-rose-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-rose-200 pb-4">
        <span className="text-lg font-black text-rose-800 flex items-center gap-2">
          <AlertCircle className="text-rose-600" size={20} /> 위험 구역
          (Danger Zone)
        </span>
      </div>
      <DangerRow
        title="시스템 전체 데이터 초기화"
        description="파티, 로그, 건의사항 등 모든 데이터를 영구적으로 삭제합니다."
        buttonLabel="모든 데이터 지우기"
        buttonClass="bg-rose-600 text-white hover:bg-rose-700"
        onClick={onDeleteAllRequest}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-rose-200">
        <div className="space-y-1">
          <p className="text-sm font-black text-rose-900">
            미니게임 랭킹 데이터 초기화
          </p>
          <p className="text-[11px] font-bold text-rose-500">
            각 미니게임 서버(Firestore)에 등록되어 있는 최고 기록
            리더보드를 전부 초기화합니다.
          </p>
        </div>
        {isMinigameResetConfirming ? (
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-rose-200 animate-in fade-in duration-200">
            <span className="text-[11px] font-black text-rose-600 mr-1 italic">
              정말 전체 포맷할까요?
            </span>
            <button
              type="button"
              disabled={isResettingMinigames}
              onClick={onMinigameReset}
              className="bg-rose-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] flex items-center justify-center min-w-[45px] disabled:opacity-50"
            >
              {isResettingMinigames ? (
                <RefreshCcw size={10} className="animate-spin" />
              ) : (
                '확인'
              )}
            </button>
            <button
              type="button"
              disabled={isResettingMinigames}
              onClick={() => onMinigameResetConfirmingChange(false)}
              className="bg-slate-200 text-slate-500 px-3 py-1.5 rounded-lg font-black text-[10px]"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onMinigameResetConfirmingChange(true)}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-3 rounded-xl text-xs font-black hover:bg-orange-600 shadow-md transition-colors whitespace-nowrap justify-center"
          >
            미니게임 기록 포맷
          </button>
        )}
      </div>

      <DangerRow
        title="서버 폭파하기"
        description="모든 데이터를 삭제하고 사이트 접근을 영구적으로 차단합니다."
        buttonLabel="서버 폭파하기"
        buttonClass="bg-black text-rose-500 hover:bg-zinc-900 border border-rose-900"
        onClick={onDestroyServerRequest}
      />
    </div>
  );
}

function DangerRow({
  title,
  description,
  buttonLabel,
  buttonClass,
  onClick,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 first:mt-0 first:pt-0 border-t first:border-t-0 border-rose-200">
      <div className="space-y-1">
        <p className="text-sm font-black text-rose-900">{title}</p>
        <p className="text-[11px] font-bold text-rose-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black shadow-md transition-colors whitespace-nowrap justify-center ${buttonClass}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function ActivityLogPanel({
  currentLogs,
  isResetConfirming,
  logPage,
  totalLogPages,
  onClearLogs,
  onExit,
  onLogPageChange,
  onLogout,
  onResetConfirmingChange,
  onRollback,
}) {
  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-wrap gap-4 justify-between items-center px-4">
        <div className="space-y-1">
          <span className="text-xl font-black text-slate-800 flex items-center gap-2">
            <ShieldCheck className="theme-text" /> 전체 활동 로그
          </span>
          <p className="text-[10px] text-slate-400 font-bold italic uppercase tracking-wider">
            매주 일요일 00:00 자동 초기화 / 일부 작업 복구 가능
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isResetConfirming ? (
            <div className="flex items-center gap-2 bg-orange-50 p-1 px-3 rounded-xl border border-orange-100">
              <span className="text-[11px] font-black text-orange-500 mr-2 italic">
                정말 삭제할까요?
              </span>
              <button
                onClick={onClearLogs}
                className="bg-orange-500 text-white px-3 py-1.5 rounded-lg font-black text-[10px]"
              >
                확인
              </button>
              <button
                onClick={() => onResetConfirmingChange(false)}
                className="bg-slate-200 text-slate-500 px-3 py-1.5 rounded-lg font-black text-[10px]"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => onResetConfirmingChange(true)}
              className="flex items-center gap-1.5 bg-orange-50 text-orange-500 px-4 py-2 rounded-xl text-[11px] font-black border border-orange-100 hover:bg-orange-100 transition-all"
            >
              <RefreshCcw size={12} /> 수동 초기화
            </button>
          )}
          <button
            type="button"
            onClick={onExit}
            className="bg-slate-800 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md hover:bg-slate-700 transition-colors flex items-center gap-1"
          >
            🏠 메인 화면으로 가기
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="bg-rose-600 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md hover:bg-rose-700 transition-colors flex items-center gap-1"
          >
            로그아웃
          </button>
        </div>
      </div>
      <LogTable
        logs={currentLogs}
        page={logPage}
        totalPages={totalLogPages}
        onPageChange={onLogPageChange}
        onRollback={onRollback}
      />
    </div>
  );
}
