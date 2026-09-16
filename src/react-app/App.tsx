// src/App.tsx

import { useEffect, useState, type FormEvent } from "react";
import {
	listMemos,
	createMemo,
	updateMemo,
	setMemoCompleted,
	deleteMemo,
	type Memo,
} from "./db";
import "./App.css";

type View = "home" | "memo";

function App() {
	const [view, setView] = useState<View>("home");

	if (view === "home") {
		return <HomePage onEnter={() => setView("memo")} />;
	}
	return <MemoPage onBack={() => setView("home")} />;
}

function HomePage({ onEnter }: { onEnter: () => void }) {
	return (
		<div className="page home">
			<h1 className="home-title">丰羽和苏苏的家</h1>
			<p className="home-subtitle">家庭事务，轻松打理</p>
			<button className="entry-card" onClick={onEnter}>
				<span className="entry-icon">记</span>
				<div className="entry-text">
					<span className="entry-title">家庭备忘录</span>
					<span className="entry-desc">记录家里的待办事项和责任人</span>
				</div>
				<span className="entry-arrow">›</span>
			</button>
		</div>
	);
}

function MemoPage({ onBack }: { onBack: () => void }) {
	const [memos, setMemos] = useState<Memo[]>([]);
	const [item, setItem] = useState("");
	const [responsible, setResponsible] = useState("");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	async function load() {
		try {
			setMemos(await listMemos());
		} catch (e) {
			setError(e instanceof Error ? e.message : "加载失败");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
	}, []);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		const nextItem = item.trim();
		const nextResponsible = responsible.trim();
		if (!nextItem || !nextResponsible) {
			setError("事项和责任人不能为空");
			return;
		}
		try {
			if (editingId == null) {
				await createMemo(nextItem, nextResponsible);
			} else {
				await updateMemo(editingId, nextItem, nextResponsible);
			}
			setItem("");
			setResponsible("");
			setEditingId(null);
			setError("");
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "保存失败");
		}
	}

	function startEdit(memo: Memo) {
		setEditingId(memo.id);
		setItem(memo.item);
		setResponsible(memo.responsible);
		setError("");
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function cancelEdit() {
		setEditingId(null);
		setItem("");
		setResponsible("");
		setError("");
	}

	async function toggleStatus(memo: Memo) {
		try {
			await setMemoCompleted(memo.id, !memo.completed);
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "操作失败");
		}
	}

	async function handleDelete(id: number) {
		if (!window.confirm("确定删除这条备忘录吗？")) return;
		try {
			await deleteMemo(id);
			if (editingId === id) cancelEdit();
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "删除失败");
		}
	}

	const pendingCount = memos.filter((m) => !m.completed).length;

	return (
		<div className="page memo">
			<header className="memo-header">
				<button className="back-btn" onClick={onBack}>
					← 返回
				</button>
				<h1>家庭备忘录</h1>
				<span className="header-count">{pendingCount} 项待办</span>
			</header>

			<form className="memo-form" onSubmit={handleSubmit}>
				<input
					value={item}
					onChange={(e) => setItem(e.target.value)}
					placeholder="事项，例如：交水电费"
					aria-label="事项"
				/>
				<input
					value={responsible}
					onChange={(e) => setResponsible(e.target.value)}
					placeholder="责任人，例如：爸爸"
					aria-label="责任人"
				/>
				<button type="submit" className="primary-btn">
					{editingId == null ? "添加" : "保存"}
				</button>
				{editingId != null && (
					<button type="button" className="ghost-btn" onClick={cancelEdit}>
						取消
					</button>
				)}
			</form>

			{error && <p className="error">{error}</p>}

			{loading ? (
				<p className="hint">加载中…</p>
			) : memos.length === 0 ? (
				<p className="hint">暂无备忘事项，添加一条吧</p>
			) : (
				<ul className="memo-list">
					{memos.map((memo) => {
						const done = memo.completed;
						return (
							<li className={`memo-item${done ? " done" : ""}`} key={memo.id}>
								<div className="memo-top">
									<span className="memo-item-text">{memo.item}</span>
									<span className={`status-badge${done ? " done" : " pending"}`}>
										{done ? "已完成" : "未完成"}
									</span>
								</div>
								<div className="memo-responsible">责任人：{memo.responsible}</div>
								<div className="memo-actions">
									<button
										className={done ? "reopen-btn" : "complete-btn"}
										onClick={() => toggleStatus(memo)}
									>
										{done ? "重新打开" : "完成"}
									</button>
									<button className="ghost-btn" onClick={() => startEdit(memo)}>
										编辑
									</button>
									<button
										className="danger-btn"
										onClick={() => handleDelete(memo.id)}
									>
										删除
									</button>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

export default App;