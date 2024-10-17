import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { INCLUDE, IncludeMods, SetField, SetNodeOptions } from './Setter/helpers/interfaces';
import * as setter from './Setter/setter.mode';

const versionDescription: INodeTypeDescription = {
	displayName: 'Body Mapper',
	name: 'bodyMapper',
	iconColor: 'blue',
	group: ['input'],
	version: 1,
	description: 'Modify, add, or remove item fields',
	subtitle: '={{$parameter["mode"]}}',
	defaults: {
		name: 'Body Mapper',
	},
	inputs: ['main'],
	outputs: ['main'],
	properties: [
		{
			displayName: 'Input Fields to Include',
			name: 'include',
			type: 'options',
			description: 'How to select the fields you want to include in your output items',
			default: 'all',
			displayOptions: {
				hide: {
					'/includeOtherFields': [false],
				},
			},
			options: [
				{
					name: 'All',
					value: INCLUDE.ALL,
					description: 'Also include all unchanged fields from the input',
				},
				{
					name: 'Selected',
					value: INCLUDE.SELECTED,
					description: 'Also include the fields listed in the parameter “Fields to Include”',
				},
				{
					name: 'All Except',
					value: INCLUDE.EXCEPT,
					description: 'Exclude the fields listed in the parameter “Fields to Exclude”',
				},
			],
		},
		...setter.description,
	],
};

export class BodyMapper implements INodeType {
	description: INodeTypeDescription = versionDescription;

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();

		const setNode = { setter };

		const returnData: INodeExecutionData[] = [];

		const rawData: IDataObject = {};

		const workflowFieldsJson = this.getNodeParameter('fields.values', 0, [], {
			rawExpressions: true,
		}) as SetField[];

		for (const entry of workflowFieldsJson) {
			if (entry.type === 'objectValue' && (entry.objectValue as string).startsWith('=')) {
				rawData[entry.name] = (entry.objectValue as string).replace(/^=+/, '');
			}
		}

		for (let i = 0; i < items.length; i++) {
			const includeOtherFields = this.getNodeParameter('includeOtherFields', i, false) as boolean;
			const include = this.getNodeParameter('include', i, 'all') as IncludeMods;
			const options = this.getNodeParameter('options', i, {});
			const node = this.getNode();

			options.include = includeOtherFields ? include : 'none';

			const newItem = await setNode['setter'].execute.call(
				this,
				items[i],
				i,
				options as SetNodeOptions,
				node,
			);
			returnData.push(newItem);
		}

		return [returnData];
	}
}

import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';

import { SetV1 } from './Setter/Setter.node';

export class Set extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'Body Mapper',
			name: 'bodyMapper',
			icon: 'fa:pen',
			group: ['input'],
			description: 'Add or edit fields on an input item and optionally remove other fields',
			defaultVersion: 3.4,
		};

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			1: new SetV1(baseDescription),
			2: new SetV1(baseDescription),
			3: new SetV1(baseDescription),
			3.1: new SetV1(baseDescription),
			3.2: new SetV1(baseDescription),
			3.3: new SetV1(baseDescription),
			3.4: new SetV1(baseDescription),
		};

		super(nodeVersions, baseDescription);
	}
}
