'use strict';

/* Dependencies */
import * as dotenv from 'dotenv';
import { serial as test } from 'ava';
import { QuickBase, QuickBaseOptions } from 'quickbase';
import { QBField, QBFieldOptions } from '../qb-field';

/* Tests */
dotenv.config();

const QB_REALM = process.env.QB_REALM!;
const QB_USERTOKEN = process.env.QB_USERTOKEN!;

const qbOptions: QuickBaseOptions = {
	server: 'api.quickbase.com',
	version: 'v1',

	realm: QB_REALM,
	userToken: QB_USERTOKEN,
	tempToken: '',

	userAgent: 'Testing',

	connectionLimit: 10,
	connectionLimitPeriod: 1000,
	errorOnConnectionLimit: false,

	proxy: false
};

const qb = new QuickBase(qbOptions);

const qbFieldOptions: QBFieldOptions = {
	quickbase: qb,
	tableId: '',
	fid: -1
};

const qbField = new QBField(qbFieldOptions);

let newAppId: string;
let newTableId: string;
let newFid: number;

test('QuickBase instance match', async (t) => {
	// @ts-ignore
	return t.truthy(qb === qbField._qb);
});

test.before('QuickBase:createApp()', async (t) => {
	const results = await qb.createApp({
		name: 'Test Node Quick Base Application',
		assignToken: true
	});

	newAppId = results.id;

	t.truthy(newAppId && results.name === 'Test Node Quick Base Application');
});

test.before('QuickBase:createTable()', async (t) => {
	const results = await qb.createTable({
		appId: newAppId,
		name: 'Test Name'
	});

	qbField.set('tableId', results.id);

	newTableId = qbField.get('tableId');

	t.truthy(qbField.get('tableId'));
});


test.after.always('QuickBase:deleteTable()', async (t) => {
	if(!newTableId){
		return t.pass();
	}

	const results = await qb.deleteTable({
		appId: newAppId,
		tableId: newTableId
	});

	t.truthy(results.deletedTableId === newTableId);
});

test.after.always('QuickBase:deleteApp()', async (t) => {
	if(!newAppId){
		return t.pass();
	}

	const results = await qb.deleteApp({
		appId: newAppId,
		name: 'Test Node Quick Base Application'
	});

	t.truthy(results.deletedAppId === newAppId);
});

test('save() - create', async (t) => {
	qbField.set('fieldType', 'text');
	qbField.set('label', 'Test Field');

	const results = await qbField.save();

	newFid = qbField.get('fid');

	t.truthy(qbField.get('fid') > 0 && qbField.get('label') === 'Test Field' && results.label === 'Test Field');
});

test('toJSON() -> fromJSON()', async (t) => {
	const json = qbField.toJSON();

	let pass = !!JSON.stringify(json);

	if(pass){
		qbField.fromJSON(json);

		pass = qbField.get('fid') === json.data?.id;
	}

	if(pass){
		t.pass();
	}else{
		t.fail();
	}
});

test('QBField.fromJSON()', async (t) => {
	const json = qbField.toJSON();
	const newQBField = QBField.fromJSON(json);

	t.truthy(newQBField.get('fid') === json.data?.id);
});

test('QBField.newField()', async (t) => {
	const newQBField = QBField.newField(qbFieldOptions, qbField.toJSON().data);

	t.truthy(newQBField.get('fid') === qbField.get('fid'));
});

test('load()', async (t) => {
	const results = await qbField.load();

	t.truthy(qbField.get('fid') === results.id && qbField.get('label') === 'Test Field' && results.label === 'Test Field');
});

test('loadUsage()', async (t) => {
	await qbField.loadUsage();

	t.truthy(qbField.get('usage'));
});

test("getFid()", (t) => {
	t.truthy(qbField.getFid() > 0);
});

test("getTableId()", (t) => {
	t.truthy(qbField.getTableId());
});

test("getUsage()", (t) => {
	t.truthy(qbField.getUsage());
});

test("get('id')", (t) => {
	t.truthy(qbField.get('id') > 0);
});

test("get('fid')", (t) => {
	t.truthy(qbField.get('fid') > 0);
});

test("get('tableId')", (t) => {
	t.truthy(qbField.get('tableId'));
});

test("get('mode')", (t) => {
	t.truthy(qbField.get('mode') !== undefined);
});

test("get('fieldType')", (t) => {
	t.truthy(qbField.get('fieldType'));
});

test("get('type')", (t) => {
	t.truthy(qbField.get('type'));
});

test("get('audited')", (t) => {
	t.truthy(qbField.get('audited') !== undefined);
});

test("get('doesDataCopy')", (t) => {
	t.truthy(qbField.get('doesDataCopy') !== undefined);
});

test("get('unique')", (t) => {
	t.truthy(qbField.get('unique') !== undefined);
});

test("get('required')", (t) => {
	t.truthy(qbField.get('required') !== undefined);
});

test("get('properties')", (t) => {
	t.truthy(qbField.get('properties') !== undefined);
});

test("get('permissions')", (t) => {
	t.truthy(qbField.get('permissions') !== undefined);
});

test("get/set('label')", (t) => {
	const fid = 'label';
	const value = 'New Test Field';

	qbField.set(fid, value);

	t.truthy(qbField.get(fid) === value);
});

test("get/set('fieldHelp')", (t) => {
	const fid = 'fieldHelp';
	const value = 'Some help text';

	qbField.set(fid, value);

	t.truthy(qbField.get(fid) === value);
});

test("get/set('bold')", (t) => {
	const fid = 'bold';
	const value = true;

	qbField.set(fid, value);

	t.truthy(qbField.get(fid) === value);
});

test("get/set('noWrap')", (t) => {
	const fid = 'noWrap';
	const value = true;

	qbField.set(fid, value);

	t.truthy(qbField.get(fid) === value);
});

test("get/set('appearsByDefault')", (t) => {
	const fid = 'appearsByDefault';
	const value = true;

	qbField.set(fid, value);

	t.truthy(qbField.get(fid) === value);
});

test("get/set('findEnabled')", (t) => {
	const fid = 'findEnabled';
	const value = true;

	qbField.set(fid, value);

	t.truthy(qbField.get(fid) === value);
});

test("get/set('addToForms')", (t) => {
	const fid = 'addToForms';
	const value = true;

	qbField.set(fid, value);

	t.truthy(qbField.get(fid) === value);
});

test("get/set('_randomValue')", (t) => {
	const fid = '_randomValue';
	const value = 'Random Value';

	qbField.set(fid, value);

	t.truthy(qbField.get(fid) === value);
});

test("get('_doesntExist')", (t) => {
	t.truthy(qbField.get('_doesntExist') === undefined);
});

test('save() - update', async (t) => {
	const results = await qbField.save([
		'label'
	]);

	t.truthy(qbField.get('fid') === newFid && qbField.get('label') === 'New Test Field' && results.label === 'New Test Field');
});

test('delete()', async (t) => {
	const results = await qbField.delete();

	t.truthy(results.deletedFieldIds[0] === newFid);
});

test('delete() - empty', async (t) => {
	const fid = qbField.get('id');

	const results = await qbField.delete();

	t.truthy(results.deletedFieldIds[0] === fid);
});
