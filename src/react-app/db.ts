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