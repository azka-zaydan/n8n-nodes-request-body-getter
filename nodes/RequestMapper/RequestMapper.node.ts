import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import * as setter from './executor';
import { INCLUDE, IncludeMods, SetField, SetNodeOptions } from './helpers/interfaces';
export class RequestMapper implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Request Mapper',
		name: 'requestMapper',
		group: ['transform'],
		version: 1,
		description: 'Basic Request Mapper',
		defaults: {
			name: 'Request Mapper',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Manual Mapping',
						value: 'manual',
						description: 'Edit item fields one by one',
						action: 'Edit item fields one by one',
					},
					{
						name: 'From JSON',
						value: 'json',
						description: 'Edit item fields from a JSON object',
						action: 'Edit item fields from a JSON object',
					},
				],
				default: 'manual',
			},
			{
				displayName: 'Fields to Set',
				name: 'assignments',
				type: 'assignmentCollection',
				displayOptions: {
					hide: {
						mode: ['json'],
					},
				},
				default: {},
			},
			{
				displayName: 'Include Other Input Fields',
				name: 'includeOtherFields',
				type: 'boolean',
				default: false,
				description:
					"Whether to pass to the output all the input fields (along with the fields set in 'Fields to Set')",
			},
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
			{
				displayName: 'Fields to Include',
				name: 'includeFields',
				type: 'string',
				default: '',
				placeholder: 'e.g. fieldToInclude1,fieldToInclude2',
				description:
					'Comma-separated list of the field names you want to include in the output. You can drag the selected fields from the input panel.',
				requiresDataPath: 'multiple',
				displayOptions: {
					show: {
						include: ['selected'],
					},
				},
			},
			{
				displayName: 'Fields to Exclude',
				name: 'excludeFields',
				type: 'string',
				default: '',
				placeholder: 'e.g. fieldToExclude1,fieldToExclude2',
				description:
					'Comma-separated list of the field names you want to exclude from the output. You can drag the selected fields from the input panel.',
				requiresDataPath: 'multiple',
				displayOptions: {
					show: {
						include: ['except'],
					},
				},
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();

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

			const newItem = await setter.execute.call(this, items[i], i, options as SetNodeOptions, node);

			returnData.push(newItem);
		}

		return [returnData];
	}
}
