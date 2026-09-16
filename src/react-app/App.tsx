// src/App.tsx

import { useEffect, useState, type FormEvent } from "react";
import {
	listMemos,
	createMemo,
	updateMemo,
	setMemoCompleted,
	deleteMemo,
	type Memo,
	listLoans,
	createLoan,
	updateLoan,
	deleteLoan,
	type LoanPayment,
	type LoanInput,
	type LoanType,
	listOverview,
	updateOverview,
	listPurchaseEvents,
	createPurchaseEvent,
	updatePurchaseEvent,
	deletePurchaseEvent,
	type OverviewKey,
	type OverviewMap,
	type PurchaseEvent,
	type PurchaseEventInput,
	listNannyComplaints,
	createNannyComplaint,
	updateNannyComplaint,
	deleteNannyComplaint,
	type NannyComplaint,
	type NannyComplaintInput,
} from "./db";
import "./App.css";

type View = "home" | "memo" | "purchase" | "loan" | "nanny";

function App() {
	const [view, setView] = useState<View>("home");

	if (view === "home") {
		return (
			<HomePage
				onEnterMemo={() => setView("memo")}
				onEnterPurchase={() => setView("purchase")}
				onEnterNanny={() => setView("nanny")}
			/>
		);
	}
	if (view === "purchase") {
		return (
			<PurchasePage
				onBack={() => setView("home")}
				onEnterLoan={() => setView("loan")}
			/>
		);
	}
	if (view === "loan") {
		return <LoanPage onBack={() => setView("purchase")} />;
	}
	if (view === "nanny") {
		return <NannyComplaintPage onBack={() => setView("home")} />;
	}
	return <MemoPage onBack={() => setView("home")} />;
}

function HomePage({
	onEnterMemo,
	onEnterPurchase,
	onEnterNanny,
}: {
	onEnterMemo: () => void;
	onEnterPurchase: () => void;
	onEnterNanny: () => void;
}) {
	return (
		<div className="page home">
			<h1 className="home-title">丰羽和苏苏的家</h1>
			<p className="home-subtitle">家庭事务，轻松打理</p>
			<div className="home-entries">
				<button className="entry-card" onClick={onEnterMemo}>
					<span className="entry-icon">记</span>
					<div className="entry-text">
						<span className="entry-title">家庭备忘录</span>
						<span className="entry-desc">记录家里的待办事项和责任人</span>
					</div>
					<span className="entry-arrow">›</span>
				</button>
				<button className="entry-card" onClick={onEnterPurchase}>
						<span className="entry-icon loan-icon">购</span>
						<div className="entry-text">
							<span className="entry-title">屿樾府购房</span>
							<span className="entry-desc">购房总览、大事记与贷款还款</span>
						</div>
						<span className="entry-arrow">›</span>
					</button>
					<button className="entry-card" onClick={onEnterNanny}>
						<span className="entry-icon nanny-icon">槽</span>
						<div className="entry-text">
							<span className="entry-title">育儿嫂吐槽</span>
							<span className="entry-desc">记录对育儿嫂的吐槽事件</span>
						</div>
						<span className="entry-arrow">›</span>
					</button>
			</div>
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

type LoanForm = {
	pay_date: string;
	period_num: string;
	loan_type: LoanType;
	amount: string;
	yfy_gjj: string;
	yfy_fb: string;
	zsy_gjj: string;
	bank_card: string;
};

const emptyLoanForm: LoanForm = {
	pay_date: "",
	period_num: "",
	loan_type: "公积金贷款",
	amount: "",
	yfy_gjj: "",
	yfy_fb: "",
	zsy_gjj: "",
	bank_card: "",
};

function money(n: number): string {
	return `¥${n.toFixed(2)}`;
}

function LoanPage({ onBack }: { onBack: () => void }) {
	const [loans, setLoans] = useState<LoanPayment[]>([]);
	const [form, setForm] = useState<LoanForm>(emptyLoanForm);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	async function load() {
		try {
			setLoans(await listLoans());
		} catch (e) {
			setError(e instanceof Error ? e.message : "加载失败");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
	}, []);

	function setField(patch: Partial<LoanForm>) {
		setForm((f) => ({ ...f, ...patch }));
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		const pay_date = form.pay_date.trim();
		if (!pay_date) {
			setError("请选择还款日期");
			return;
		}
		const period_num = Number(form.period_num);
		if (form.period_num.trim() === "" || !Number.isInteger(period_num) || period_num <= 0) {
			setError("还款期数需为正整数");
			return;
		}
		const amount = Number(form.amount);
		if (form.amount.trim() === "" || Number.isNaN(amount) || amount < 0) {
			setError("请填写本期还款金额");
			return;
		}
		const toMoney = (v: number) => Math.round(v * 100) / 100;
		const input: LoanInput = {
			pay_date,
			period_num,
			loan_type: form.loan_type,
			amount: toMoney(amount),
			yfy_gjj: toMoney(Number(form.yfy_gjj) || 0),
			yfy_fb: toMoney(Number(form.yfy_fb) || 0),
			zsy_gjj: toMoney(Number(form.zsy_gjj) || 0),
			bank_card: toMoney(Number(form.bank_card) || 0),
		};
		try {
			if (editingId == null) {
				await createLoan(input);
			} else {
				await updateLoan(editingId, input);
			}
			setForm(emptyLoanForm);
			setEditingId(null);
			setShowForm(false);
			setError("");
			await load();
		} catch (err) {
			setError(err instanceof Error ? err.message : "保存失败");
		}
	}

	function openAddForm() {
		setEditingId(null);
		setForm(emptyLoanForm);
		setError("");
		setShowForm(true);
	}

	function startEdit(loan: LoanPayment) {
		setEditingId(loan.id);
		setForm({
			pay_date: loan.pay_date,
			period_num: String(loan.period_num),
			loan_type: loan.loan_type,
			amount: String(loan.amount),
			yfy_gjj: String(loan.yfy_gjj),
			yfy_fb: String(loan.yfy_fb),
			zsy_gjj: String(loan.zsy_gjj),
			bank_card: String(loan.bank_card),
		});
		setError("");
		setShowForm(true);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function cancelEdit() {
		setEditingId(null);
		setForm(emptyLoanForm);
		setError("");
		setShowForm(false);
	}

	async function handleDelete(id: number) {
		if (!window.confirm("确定删除这条还款记录吗？")) return;
		try {
			await deleteLoan(id);
			if (editingId === id) cancelEdit();
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "删除失败");
		}
	}

	return (
		<div className="page loan">
			<header className="loan-header">
				<button className="back-btn" onClick={onBack}>
					← 返回
				</button>
				<h1>屿樾府贷款</h1>
			</header>

			<div className="events-head">
				<h2 className="section-title">还款记录</h2>
				<button className="add-btn" onClick={openAddForm}>
					添加还款
				</button>
			</div>

			{showForm && (
			<form className="loan-form" onSubmit={handleSubmit}>
				<label className="field">
					<span className="field-label">日期</span>
					<input
						type="date"
						value={form.pay_date}
						onChange={(e) => setField({ pay_date: e.target.value })}
					/>
				</label>
				<label className="field">
					<span className="field-label">还款期数</span>
					<input
						type="number"
						min={1}
						step={1}
						inputMode="numeric"
						placeholder="例如：12"
						value={form.period_num}
						onChange={(e) => setField({ period_num: e.target.value })}
					/>
				</label>
				<label className="field">
					<span className="field-label">还款类型</span>
					<select
						value={form.loan_type}
						onChange={(e) => setField({ loan_type: e.target.value as LoanType })}
					>
						<option value="公积金贷款">公积金贷款</option>
						<option value="商业贷款">商业贷款</option>
					</select>
				</label>
				<label className="field">
					<span className="field-label">本期还款金额</span>
					<input
						type="number"
						min={0}
						step={0.01}
						inputMode="decimal"
						placeholder="0.00"
						value={form.amount}
						onChange={(e) => setField({ amount: e.target.value })}
					/>
				</label>

				<div className="field-group">
					<span className="field-group-title">扣款项</span>
					<div className="loan-grid">
						<label className="field">
							<span className="field-label">杨丰羽公积金</span>
							<input
								type="number"
								min={0}
								step={0.01}
								inputMode="decimal"
								placeholder="0.00"
								value={form.yfy_gjj}
								onChange={(e) => setField({ yfy_gjj: e.target.value })}
							/>
						</label>
						<label className="field">
							<span className="field-label">杨丰羽房补</span>
							<input
								type="number"
								min={0}
								step={0.01}
								inputMode="decimal"
								placeholder="0.00"
								value={form.yfy_fb}
								onChange={(e) => setField({ yfy_fb: e.target.value })}
							/>
						</label>
						<label className="field">
							<span className="field-label">郑苏沂公积金</span>
							<input
								type="number"
								min={0}
								step={0.01}
								inputMode="decimal"
								placeholder="0.00"
								value={form.zsy_gjj}
								onChange={(e) => setField({ zsy_gjj: e.target.value })}
							/>
						</label>
						<label className="field">
							<span className="field-label">银行卡</span>
							<input
								type="number"
								min={0}
								step={0.01}
								inputMode="decimal"
								placeholder="0.00"
								value={form.bank_card}
								onChange={(e) => setField({ bank_card: e.target.value })}
							/>
						</label>
					</div>
				</div>

				<button type="submit" className="primary-btn">
						{editingId == null ? "添加还款" : "保存修改"}
					</button>
					{editingId != null && (
						<button type="button" className="ghost-btn" onClick={cancelEdit}>
							取消
						</button>
					)}
				</form>
			)}

			{error && <p className="error">{error}</p>}

			{loading ? (
				<p className="hint">加载中…</p>
			) : loans.length === 0 ? (
				<p className="hint">暂无还款记录，先录入一条吧</p>
			) : (
				<ul className="loan-list">
					{loans.map((loan) => (
						<li className="loan-item" key={loan.id}>
							<div className="loan-top">
								<span className="loan-period">第 {loan.period_num} 期</span>
								<span className="loan-date">{loan.pay_date}</span>
								<span className={`loan-type${loan.loan_type === "商业贷款" ? " sy" : " gjj"}`}>
									{loan.loan_type}
								</span>
							</div>
							<div className="loan-amount">本期还款：{money(loan.amount)}</div>
							<div className="loan-deducations">
								<span className="loan-deduc-title">扣款项</span>
								<div className="loan-deduc-grid">
									<span>杨丰羽公积金 <b>{money(loan.yfy_gjj)}</b></span>
									<span>杨丰羽房补 <b>{money(loan.yfy_fb)}</b></span>
									<span>郑苏沂公积金 <b>{money(loan.zsy_gjj)}</b></span>
									<span>银行卡 <b>{money(loan.bank_card)}</b></span>
								</div>
							</div>
							<div className="loan-actions">
								<button className="ghost-btn" onClick={() => startEdit(loan)}>
									编辑
								</button>
								<button className="danger-btn" onClick={() => handleDelete(loan.id)}>
									删除
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function NannyComplaintPage({ onBack }: { onBack: () => void }) {
	const [items, setItems] = useState<NannyComplaint[]>([]);
	const [date, setDate] = useState("");
	const [content, setContent] = useState("");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	async function load() {
		try {
			setItems(await listNannyComplaints());
		} catch (e) {
			setError(e instanceof Error ? e.message : "加载失败");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
	}, []);

	function openAdd() {
		setEditingId(null);
		setDate("");
		setContent("");
		setError("");
		setShowForm(true);
	}

	function startEdit(item: NannyComplaint) {
		setEditingId(item.id);
		setDate(toIsoDate(item.event_date));
		setContent(item.content);
		setError("");
		setShowForm(true);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function cancel() {
		setEditingId(null);
		setDate("");
		setContent("");
		setError("");
		setShowForm(false);
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		const event_date = date.trim();
		const nextContent = content.trim();
		if (!event_date || !nextContent) {
			setError("请填写日期和吐槽事件");
			return;
		}
		const input: NannyComplaintInput = { event_date, content: nextContent };
		try {
			if (editingId == null) {
				await createNannyComplaint(input);
			} else {
				await updateNannyComplaint(editingId, input);
			}
			setShowForm(false);
			setEditingId(null);
			setDate("");
			setContent("");
			setError("");
			await load();
		} catch (err) {
			setError(err instanceof Error ? err.message : "保存失败");
		}
	}

	async function handleDelete(id: number) {
		if (!window.confirm("确定删除这条吐槽吗？")) return;
		try {
			await deleteNannyComplaint(id);
			if (editingId === id) cancel();
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "删除失败");
		}
	}

	return (
		<div className="page nanny">
			<header className="loan-header">
				<button className="back-btn" onClick={onBack}>
					← 返回
				</button>
				<h1>育儿嫂吐槽</h1>
			</header>

			<div className="events-head">
				<h2 className="section-title">吐槽列表</h2>
				<button className="add-btn" onClick={openAdd}>
					增加吐槽
				</button>
			</div>

			{showForm && (
				<form className="event-form" onSubmit={handleSubmit}>
					<label className="field">
						<span className="field-label">日期</span>
						<input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
					</label>
					<label className="field">
						<span className="field-label">吐槽事件</span>
						<textarea
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="例如：今天育儿嫂……"
						/>
					</label>
					<div className="event-form-actions">
						<button type="submit" className="primary-btn">
							{editingId == null ? "添加吐槽" : "保存修改"}
						</button>
						<button type="button" className="ghost-btn" onClick={cancel}>
							取消
						</button>
					</div>
				</form>
			)}

			{error && <p className="error">{error}</p>}

			{loading ? (
				<p className="hint">加载中…</p>
			) : items.length === 0 ? (
				<p className="hint">暂无吐槽，点“增加吐槽”记录一条吧</p>
			) : (
				<ul className="event-list">
					{items.map((it) => (
						<li className="event-card" key={it.id}>
							<div className="event-head">
								<span className="event-date">{formatDate(it.event_date)}</span>
							</div>
							<p className="complaint-content">{it.content}</p>
							<div className="event-actions">
								<button className="ghost-btn" onClick={() => startEdit(it)}>
									编辑
								</button>
								<button className="danger-btn" onClick={() => handleDelete(it.id)}>
									删除
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

const OVERVIEW_FIELDS: { key: OverviewKey; label: string }[] = [
	{ key: "original_price", label: "购房原价" },
	{ key: "deduction", label: "扣除房票" },
	{ key: "actual_price", label: "购房实际价格" },
	{ key: "down_payment", label: "首付" },
	{ key: "early_repayment", label: "提前还款" },
	{ key: "gjj_loan", label: "公积金贷款" },
	{ key: "sy_loan", label: "商业贷款" },
];

function formatWan(n: number): string {
	if (n % 10000 === 0) return `${Math.round(n / 10000)}万`;
	const wan = Math.floor(n / 10000);
	const yuan = String(n % 10000).padStart(4, "0");
	return wan > 0 ? `${wan}万${yuan}` : yuan;
}

function toIsoDate(s: string): string {
	const m = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
	if (m) {
		return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
	}
	return s;
}

function formatDate(s: string): string {
	const iso = toIsoDate(s);
	const m = iso.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
	if (m) {
		return `${Number(m[1])}.${Number(m[2])}.${Number(m[3])}`;
	}
	return s;
}

type EventForm = {
	event_date: string;
	title: string;
	itemsText: string;
};

const emptyEventForm: EventForm = {
	event_date: "",
	title: "",
	itemsText: "",
};

function PurchasePage({
	onBack,
	onEnterLoan,
}: {
	onBack: () => void;
	onEnterLoan: () => void;
}) {
	const [overview, setOverview] = useState<OverviewMap>({});
	const [events, setEvents] = useState<PurchaseEvent[]>([]);
	const [editingKey, setEditingKey] = useState<OverviewKey | null>(null);
	const [editWan, setEditWan] = useState("");
	const [editYuan, setEditYuan] = useState("");
	const [eventForm, setEventForm] = useState<EventForm>(emptyEventForm);
	const [editingEventId, setEditingEventId] = useState<number | null>(null);
	const [showEventForm, setShowEventForm] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	async function load() {
		try {
			const [ov, evs] = await Promise.all([listOverview(), listPurchaseEvents()]);
			setOverview(ov);
			setEvents(evs);
		} catch (e) {
			setError(e instanceof Error ? e.message : "加载失败");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
	}, []);

	function startEditOverview(key: OverviewKey) {
		const value = overview[key] ?? 0;
		setEditingKey(key);
		setEditWan(String(Math.floor(value / 10000)));
		setEditYuan(String(value % 10000));
		setError("");
	}

	function cancelEditOverview() {
		setEditingKey(null);
		setEditWan("");
		setEditYuan("");
	}

	async function saveEditOverview() {
		if (!editingKey) return;
		const wan = Number(editWan) || 0;
		const yuan = Number(editYuan) || 0;
		const value = wan * 10000 + yuan;
		try {
			await updateOverview(editingKey, value);
			setEditingKey(null);
			setEditWan("");
			setEditYuan("");
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "保存失败");
		}
	}

	function openNewEvent() {
		setEventForm(emptyEventForm);
		setEditingEventId(null);
		setShowEventForm(true);
		setError("");
	}

	function openEditEvent(ev: PurchaseEvent) {
		setEventForm({
			event_date: toIsoDate(ev.event_date),
			title: ev.title,
			itemsText: ev.items.join("\n"),
		});
		setEditingEventId(ev.id);
		setShowEventForm(true);
		setError("");
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function cancelEventForm() {
		setShowEventForm(false);
		setEditingEventId(null);
		setEventForm(emptyEventForm);
	}

	async function handleEventSubmit(e: FormEvent) {
		e.preventDefault();
		const event_date = eventForm.event_date.trim();
		const title = eventForm.title.trim();
		if (!event_date || !title) {
			setError("请填写日期和事件");
			return;
		}
		const items = eventForm.itemsText
			.split("\n")
			.map((s) => s.trim())
			.filter(Boolean);
		const input: PurchaseEventInput = { event_date, title, items };
		try {
			if (editingEventId == null) {
				await createPurchaseEvent(input);
			} else {
				await updatePurchaseEvent(editingEventId, input);
			}
			setShowEventForm(false);
			setEditingEventId(null);
			setEventForm(emptyEventForm);
			setError("");
			await load();
		} catch (err) {
			setError(err instanceof Error ? err.message : "保存失败");
		}
	}

	async function handleDeleteEvent(id: number) {
		if (!window.confirm("确定删除这个事件吗？")) return;
		try {
			await deletePurchaseEvent(id);
			if (editingEventId === id) cancelEventForm();
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "删除失败");
		}
	}

	return (
		<div className="page purchase">
			<header className="loan-header">
				<button className="back-btn" onClick={onBack}>
					← 返回
				</button>
				<h1>屿樾府购房</h1>
			</header>

			<section className="section-card">
				<h2 className="section-title">总览</h2>
				<ul className="overview-list">
					{OVERVIEW_FIELDS.map((f) => {
						const value = overview[f.key] ?? 0;
						const editing = editingKey === f.key;
						return (
							<li className="overview-row" key={f.key}>
								<span className="overview-label">{f.label}</span>
								{editing ? (
									<div className="overview-edit">
										<input
											type="number"
											min={0}
											step={1}
											inputMode="numeric"
											value={editWan}
											onChange={(e) => setEditWan(e.target.value)}
											aria-label={`${f.label} 万`}
										/>
										<span>万</span>
										<input
											type="number"
											min={0}
											step={1}
											inputMode="numeric"
											value={editYuan}
											onChange={(e) => setEditYuan(e.target.value)}
											aria-label={`${f.label} 元`}
										/>
										<span>元</span>
										<button className="save-btn" onClick={saveEditOverview}>
											保存
										</button>
										<button className="ghost-btn" onClick={cancelEditOverview}>
											取消
										</button>
									</div>
								) : (
									<div className="overview-value-wrap">
										<span className="overview-value">{formatWan(value)}</span>
										<button className="edit-btn" onClick={() => startEditOverview(f.key)}>
											编辑
										</button>
									</div>
								)}
							</li>
						);
					})}
				</ul>
				<button className="loan-entry-btn" onClick={onEnterLoan}>
					屿樾府贷款
				</button>
			</section>

			<section className="section-card">
				<div className="events-head">
					<h2 className="section-title">事件</h2>
					<button className="add-btn" onClick={openNewEvent}>
						增加事件
					</button>
				</div>

				{showEventForm && (
					<form className="event-form" onSubmit={handleEventSubmit}>
						<label className="field">
							<span className="field-label">日期</span>
							<input
								type="date"
								value={eventForm.event_date}
								onChange={(e) =>
									setEventForm((f) => ({ ...f, event_date: e.target.value }))
								}
							/>
						</label>
						<label className="field">
							<span className="field-label">事件</span>
							<input
								value={eventForm.title}
								onChange={(e) =>
									setEventForm((f) => ({ ...f, title: e.target.value }))
								}
								placeholder="例如：首付125万5189"
							/>
						</label>
						<label className="field">
							<span className="field-label">子事件列表（每行一个）</span>
							<textarea
								value={eventForm.itemsText}
								onChange={(e) =>
									setEventForm((f) => ({ ...f, itemsText: e.target.value }))
								}
								placeholder={"购买车位1万\n杨晓雪100万"}
							/>
						</label>
						<div className="event-form-actions">
							<button type="submit" className="primary-btn">
								{editingEventId == null ? "添加事件" : "保存修改"}
							</button>
							<button type="button" className="ghost-btn" onClick={cancelEventForm}>
								取消
							</button>
						</div>
					</form>
				)}

				{error && <p className="error">{error}</p>}

				{loading ? (
					<p className="hint">加载中…</p>
				) : events.length === 0 ? (
					<p className="hint">暂无事件，点击“增加事件”记录一条吧</p>
				) : (
					<ul className="event-list">
						{events.map((ev) => (
							<li className="event-card" key={ev.id}>
								<div className="event-head">
									<span className="event-date">{formatDate(ev.event_date)}</span>
									<span className="event-title">{ev.title}</span>
								</div>
								{ev.items.length > 0 && (
									<ul className="event-items">
										{ev.items.map((it, i) => (
											<li key={i}>{it}</li>
										))}
									</ul>
								)}
								<div className="event-actions">
									<button className="ghost-btn" onClick={() => openEditEvent(ev)}>
										编辑
									</button>
									<button className="danger-btn" onClick={() => handleDeleteEvent(ev.id)}>
										删除
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}

export default App;