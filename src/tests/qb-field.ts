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
const QB_APPID = process.env.QB_APPID!;

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
	dbid: '',
	fid: -1
};

const qbField = new QBField(qbFieldOptions);

let dbid: string = '',
	fid: number = -1;

test('QuickBase:createTable()', async (t) => {
	const results = await qb.createTable({
		appId: QB_APPID,
		name: 'Test Name'
	});

	qbField.set('dbid', results.id);

	dbid = qbField.get('dbid');

	t.truthy(qbField.get('dbid'));
});

test('save() - create', async (t) => {
	qbField.set('fieldType', 'text');
	qbField.set('label', 'Test Field');

	const results = await qbField.save();

	fid = qbField.get('fid');

	t.truthy(qbField.get('fid') > 0 && qbField.get('label') === 'Test Field' && results.label === 'Test Field');
});

test('toJSON() -> fromJSON()', async (t) => {
	const json = qbField.toJSON();

	let pass = !!JSON.stringify(json);

	if(pass){
		qbField.fromJSON(json);

		pass = JSON.stringify(qbField.toJSON()) === JSON.stringify(json);
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

	t.truthy(JSON.stringify(newQBField.toJSON()) === JSON.stringify(json));
});

test('QBField.newField()', async (t) => {
	const newQBField = QBField.newField(qbFieldOptions, qbField.toJSON().data);

	t.truthy(newQBField.get('fid') === qbField.get('fid'));
});

test('load()', async (t) => {
	const results = await qbField.load();

	t.truthy(qbField.get('fid') === results.id && qbField.get('label') === 'Test Field' && results.label === 'Test Field');
});

test('save() - update', async (t) => {
	qbField.set('label', 'New Test Field');

	const results = await qbField.save();

	t.truthy(qbField.get('fid') === fid && qbField.get('label') === 'New Test Field' && results.label === 'New Test Field');
});

test('delete()', async (t) => {
	const results = await qbField.delete();

	t.truthy(results.deletedFieldIds[0] === fid);
});

test('QuickBase:deleteTable()', async (t) => {
	const results = await qb.deleteTable({
		appId: QB_APPID,
		tableId: dbid
	});

	t.truthy(results.deletedTableId === dbid);
});
