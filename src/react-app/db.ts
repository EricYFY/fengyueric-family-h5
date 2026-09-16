import cloudbase from "@cloudbase/js-sdk";

export type Memo = {
	id: number;
	item: string;
	responsible: string;
	completed: boolean;
	created_at: string;
};

type Rdb = ReturnType<ReturnType<typeof cloudbase.init>["rdb"]>;

let rdb: Rdb | null = null;
let initPromise: Promise<Rdb> | null = null;

function getRdb(): Promise<Rdb> {
	if (rdb) return Promise.resolve(rdb);
	if (!initPromise) {
		initPromise = (async () => {
			const app = cloudbase.init({
				env: import.meta.env.VITE_CLOUDBASE_ENV_ID,
			});
			await app.auth.signInAnonymously();
			rdb = app.rdb();
			return rdb;
		})();
	}
	return initPromise;
}

function throwIfError(error: { message?: string } | null): void {
	if (error) {
		throw new Error(error.message || "请求失败");
	}
}

export async function listMemos(): Promise<Memo[]> {
	const db = await getRdb();
	const { data, error } = await db
		.from("memos")
		.select("id, item, responsible, completed, created_at")
		.order("completed", { ascending: true })
		.order("id", { ascending: false });
	throwIfError(error);
	return (data ?? []) as Memo[];
}

export async function createMemo(item: string, responsible: string): Promise<void> {
	const db = await getRdb();
	const { error } = await db.from("memos").insert({ item, responsible });
	throwIfError(error);
}

export async function updateMemo(
	id: number,
	item: string,
	responsible: string,
): Promise<void> {
	const db = await getRdb();
	const { error } = await db
		.from("memos")
		.update({ item, responsible })
		.eq("id", id);
	throwIfError(error);
}

export async function setMemoCompleted(id: number, completed: boolean): Promise<void> {
	const db = await getRdb();
	const { error } = await db.from("memos").update({ completed }).eq("id", id);
	throwIfError(error);
}

export async function deleteMemo(id: number): Promise<void> {
	const db = await getRdb();
	const { error } = await db.from("memos").delete().eq("id", id);
	throwIfError(error);
}

// ---------- 屿樾府贷款 ----------

export type LoanType = "公积金贷款" | "商业贷款";

export type LoanPayment = {
	id: number;
	pay_date: string;
	period_num: number;
	loan_type: LoanType;
	amount: number;
	yfy_gjj: number;
	yfy_fb: number;
	zsy_gjj: number;
	bank_card: number;
	created_at: string;
};

export type LoanInput = Omit<LoanPayment, "id" | "created_at">;

function normalizeLoan(row: LoanPayment): LoanPayment {
	return {
		id: row.id,
		pay_date: row.pay_date,
		period_num: Number(row.period_num),
		loan_type: row.loan_type,
		amount: Number(row.amount),
		yfy_gjj: Number(row.yfy_gjj),
		yfy_fb: Number(row.yfy_fb),
		zsy_gjj: Number(row.zsy_gjj),
		bank_card: Number(row.bank_card),
		created_at: row.created_at,
	};
}

export async function listLoans(): Promise<LoanPayment[]> {
	const db = await getRdb();
	const { data, error } = await db
		.from("loan_payments")
		.select(
			"id, pay_date, period_num, loan_type, amount, yfy_gjj, yfy_fb, zsy_gjj, bank_card, created_at",
		)
		.order("pay_date", { ascending: false })
		.order("id", { ascending: false });
	throwIfError(error);
	return (data ?? []).map((row) => normalizeLoan(row as LoanPayment));
}

export async function createLoan(input: LoanInput): Promise<void> {
	const db = await getRdb();
	const { error } = await db.from("loan_payments").insert(input);
	throwIfError(error);
}

export async function updateLoan(id: number, input: LoanInput): Promise<void> {
	const db = await getRdb();
	const { error } = await db.from("loan_payments").update(input).eq("id", id);
	throwIfError(error);
}

export async function deleteLoan(id: number): Promise<void> {
	const db = await getRdb();
	const { error } = await db.from("loan_payments").delete().eq("id", id);
	throwIfError(error);
}

// ---------- 屿樾府购房 ----------

export type OverviewKey =
	| "original_price"
	| "deduction"
	| "actual_price"
	| "down_payment"
	| "early_repayment"
	| "gjj_loan"
	| "sy_loan";

export type OverviewMap = Partial<Record<OverviewKey, number>>;

export type PurchaseEvent = {
	id: number;
	event_date: string;
	title: string;
	items: string[];
	created_at: string;
};

export type PurchaseEventInput = {
	event_date: string;
	title: string;
	items: string[];
};

export async function listOverview(): Promise<OverviewMap> {
	const db = await getRdb();
	const { data, error } = await db.from("purchase_overview").select("key, value");
	throwIfError(error);
	const rows = (data ?? []) as { key: string; value: number | string }[];
	const map: OverviewMap = {};
	for (const row of rows) {
		map[row.key as OverviewKey] = Number(row.value);
	}
	return map;
}

export async function updateOverview(key: OverviewKey, value: number): Promise<void> {
	const db = await getRdb();
	const { error } = await db.from("purchase_overview").update({ value }).eq("key", key);
	throwIfError(error);
}

function normalizeEvent(row: PurchaseEvent): PurchaseEvent {
	const rawItems = typeof row.items === "string" ? row.items : "";
	return {
		id: row.id,
		event_date: row.event_date,
		title: row.title,
		items: rawItems
			.split("\n")
			.map((s) => s.trim())
			.filter(Boolean),
		created_at: row.created_at,
	};
}

export async function listPurchaseEvents(): Promise<PurchaseEvent[]> {
	const db = await getRdb();
	const { data, error } = await db
		.from("purchase_events")
		.select("id, event_date, title, items, created_at")
		.order("id", { ascending: true });
	throwIfError(error);
	return (data ?? []).map((row) => normalizeEvent(row as PurchaseEvent));
}

export async function createPurchaseEvent(input: PurchaseEventInput): Promise<void> {
	const db = await getRdb();
	const { error } = await db.from("purchase_events").insert({
		event_date: input.event_date,
		title: input.title,
		items: input.items.join("\n"),
	});
	throwIfError(error);
}

export async function updatePurchaseEvent(
	id: number,
	input: PurchaseEventInput,
): Promise<void> {
	const db = await getRdb();
	const { error } = await db
		.from("purchase_events")
		.update({
			event_date: input.event_date,
			title: input.title,
			items: input.items.join("\n"),
		})
		.eq("id", id);
	throwIfError(error);
}

export async function deletePurchaseEvent(id: number): Promise<void> {
	const db = await getRdb();
	const { error } = await db.from("purchase_events").delete().eq("id", id);
	throwIfError(error);
}

// ---------- 育儿嫂吐槽 ----------

export type NannyComplaint = {
	id: number;
	event_date: string;
	content: string;
	created_at: string;
};

export type NannyComplaintInput = {
	event_date: string;
	content: string;
};

export async function listNannyComplaints(): Promise<NannyComplaint[]> {
	const db = await getRdb();
	const { data, error } = await db
		.from("nanny_complaints")
		.select("id, event_date, content, created_at")
		.order("event_date", { ascending: false })
		.order("id", { ascending: false });
	throwIfError(error);
	return (data ?? []) as NannyComplaint[];
}

export async function createNannyComplaint(input: NannyComplaintInput): Promise<void> {
	const db = await getRdb();
	const { error } = await db.from("nanny_complaints").insert(input);
	throwIfError(error);
}

export async function updateNannyComplaint(
	id: number,
	input: NannyComplaintInput,
): Promise<void> {
	const db = await getRdb();
	const { error } = await db.from("nanny_complaints").update(input).eq("id", id);
	throwIfError(error);
}

export async function deleteNannyComplaint(id: number): Promise<void> {
	const db = await getRdb();
	const { error } = await db.from("nanny_complaints").delete().eq("id", id);
	throwIfError(error);
}