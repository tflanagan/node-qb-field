'use strict';

/* Dependencies */
import * as dotenv from 'dotenv';
import ava from 'ava';
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

const qbField = new QBField<{
	_randomValue: string
}>(qbFieldOptions);

let newAppId: string;
let newTableId: string;
let newFid: number;

ava.serial('QuickBase instance match', async (t) => {
	// @ts-ignore
	return t.truthy(qb === qbField._qb);
});

ava.serial.before('QuickBase:createApp()', async (t) => {
	const results = await qb.createApp({
		name: 'Test Node Quick Base Application',
		assignToken: true
	});

	newAppId = results.id;

	return t.truthy(newAppId && results.name === 'Test Node Quick Base Application');
});

ava.serial.before('QuickBase:createTable()', async (t) => {
	const results = await qb.createTable({
		appId: newAppId,
		name: 'Test Name'
	});

	qbField.set('tableId', results.id);

	newTableId = qbField.get('tableId');

	return t.truthy(qbField.get('tableId'));
});


ava.serial.after.always('QuickBase:deleteTable()', async (t) => {
	if(!newTableId){
		return t.pass();
	}

	const results = await qb.deleteTable({
		appId: newAppId,
		tableId: newTableId
	});

	return t.truthy(results.deletedTableId === newTableId);
});

ava.serial.after.always('QuickBase:deleteApp()', async (t) => {
	if(!newAppId){
		return t.pass();
	}

	const results = await qb.deleteApp({
		appId: newAppId,
		name: 'Test Node Quick Base Application'
	});

	return t.truthy(results.deletedAppId === newAppId);
});

ava.serial('save() - create', async (t) => {
	qbField.set('fieldType', 'text');
	qbField.set('label', 'Test Field');

	const results = await qbField.save();

	newFid = qbField.get('fid');

	return t.truthy(qbField.get('fid') > 0 && qbField.get('label') === 'Test Field' && results.label === 'Test Field');
});

ava.serial('toJSON() -> fromJSON()', async (t) => {
	const json = qbField.toJSON();

	let pass = !!JSON.stringify(json);

	if(pass){
		qbField.fromJSON(json);

		pass = qbField.get('fid') === json.fid;
	}

	if(pass){
		t.pass();
	}else{
		t.fail();
	}
});

ava.serial('QBField.fromJSON()', async (t) => {
	const json = qbField.toJSON();
	const newQBField = QBField.fromJSON(json);

	return t.truthy(newQBField.get('fid') === json.fid);
});

ava.serial('QBField.NewField()', async (t) => {
	const newQBField = QBField.NewField(qbFieldOptions, {
		id: qbField.getFid(),
		...qbField.toJSON().data
	});

	return t.truthy(newQBField.get('fid') === qbField.get('fid'));
});

ava.serial('load()', async (t) => {
	const results = await qbField.load();

	return t.truthy(qbField.get('label') === 'Test Field' && results.label === 'Test Field');
});

ava.serial('loadUsage()', async (t) => {
	await qbField.loadUsage();

	return t.truthy(qbField.get('usage'));
});

ava.serial("getFid()", (t) => {
	return t.truthy(qbField.getFid() > 0);
});

ava.serial("getTableId()", (t) => {
	return t.truthy(qbField.getTableId());
});

ava.serial("getUsage()", (t) => {
	return t.truthy(qbField.getUsage());
});

ava.serial("get('id')", (t) => {
	return t.truthy(qbField.get('id') > 0);
});

ava.serial("get('fid')", (t) => {
	return t.truthy(qbField.get('fid') > 0);
});

ava.serial("get('tableId')", (t) => {
	return t.truthy(qbField.get('tableId'));
});

ava.serial("get('mode')", (t) => {
	return t.truthy(qbField.get('mode') !== undefined);
});

ava.serial("get('fieldType')", (t) => {
	return t.truthy(qbField.get('fieldType'));
});

ava.serial("get('type')", (t) => {
	return t.truthy(qbField.get('type'));
});

ava.serial("get('audited')", (t) => {
	return t.truthy(qbField.get('audited') !== undefined);
});

ava.serial("get('doesDataCopy')", (t) => {
	return t.truthy(qbField.get('doesDataCopy') !== undefined);
});

ava.serial("get('unique')", (t) => {
	return t.truthy(qbField.get('unique') !== undefined);
});

ava.serial("get('required')", (t) => {
	return t.truthy(qbField.get('required') !== undefined);
});

ava.serial("get('properties')", (t) => {
	return t.truthy(qbField.get('properties') !== undefined);
});

ava.serial("get('permissions')", (t) => {
	return t.truthy(qbField.get('permissions') !== undefined);
});

ava.serial("get/set('label')", (t) => {
	const fid = 'label';
	const value = 'New Test Field';

	qbField.set(fid, value);

	return t.truthy(qbField.get(fid) === value);
});

ava.serial("get/set('fieldHelp')", (t) => {
	const fid = 'fieldHelp';
	const value = 'Some help text';

	qbField.set(fid, value);

	return t.truthy(qbField.get(fid) === value);
});

ava.serial("get/set('bold')", (t) => {
	const fid = 'bold';
	const value = true;

	qbField.set(fid, value);

	return t.truthy(qbField.get(fid) === value);
});

ava.serial("get/set('noWrap')", (t) => {
	const fid = 'noWrap';
	const value = true;

	qbField.set(fid, value);

	return t.truthy(qbField.get(fid) === value);
});

ava.serial("get/set('appearsByDefault')", (t) => {
	const fid = 'appearsByDefault';
	const value = true;

	qbField.set(fid, value);

	return t.truthy(qbField.get(fid) === value);
});

ava.serial("get/set('findEnabled')", (t) => {
	const fid = 'findEnabled';
	const value = true;

	qbField.set(fid, value);

	return t.truthy(qbField.get(fid) === value);
});

ava.serial("get/set('addToForms')", (t) => {
	const fid = 'addToForms';
	const value = true;

	qbField.set(fid, value);

	return t.truthy(qbField.get(fid) === value);
});

ava.serial("get/set('_randomValue')", (t) => {
	const fid = '_randomValue';
	const value = 'Random Value';

	qbField.set(fid, value);

	return t.truthy(qbField.get(fid) === value);
});

ava.serial("get('_doesntExist')", (t) => {
	const val = qbField.get('_doesntExist');
	
	return t.truthy(val === undefined);
});

ava.serial('save() - update', async (t) => {
	const results = await qbField.save({
			attributesToSave: [
				'label'
			]
		});

	return t.truthy(qbField.get('fid') === newFid && qbField.get('label') === 'New Test Field' && results.label === 'New Test Field');
});

ava.serial('delete()', async (t) => {
	const results = await qbField.delete();

	return t.truthy(results.deletedFieldIds[0] === newFid);
});

ava.serial('delete() - empty', async (t) => {
	const fid = qbField.get('id');

	const results = await qbField.delete();

	t.log(results, fid);

	return t.truthy(results.deletedFieldIds[0] === fid);
});
