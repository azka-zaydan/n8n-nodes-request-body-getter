import {
	AssignmentCollectionValue,
	FieldType,
	IDisplayOptions,
	IExecuteFunctions,
	INode,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { SetNodeOptions } from './helpers/interfaces';
import { composeReturnItem, updateDisplayOptions, validateEntry } from './helpers/utils';

const displayOptions: IDisplayOptions = {
	show: {
		mode: ['manual'],
	},
};

const properties: INodeProperties[] = [
	{
		displayName: 'Fields to Set',
		name: 'fields',
		placeholder: 'Add Field',
		type: 'fixedCollection',
		description: 'Edit existing fields or add new ones to modify the output data',
		typeOptions: {
			multipleValues: true,
			sortable: true,
		},
		default: {},
		options: [
			{
				name: 'body',
				displayName: 'Body',
				values: [
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
						placeholder: 'e.g. fieldName',
						description:
							'Name of the field to set the value of. Supports dot-notation. Example: data.person[0].name.',
						requiresDataPath: 'single',
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						description: 'The field value type',
						// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
						options: [
							{
								name: 'String',
								value: 'stringValue',
							},
							{
								name: 'Number',
								value: 'numberValue',
							},
							{
								name: 'Boolean',
								value: 'booleanValue',
							},
							{
								name: 'Array',
								value: 'arrayValue',
							},
							{
								name: 'Object',
								value: 'objectValue',
							},
						],
						default: 'stringValue',
					},
					{
						displayName: 'Value',
						name: 'stringValue',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['stringValue'],
							},
						},
						validateType: 'string',
						ignoreValidationDuringExecution: true,
					},
					{
						displayName: 'Value',
						name: 'numberValue',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['numberValue'],
							},
						},
						validateType: 'number',
						ignoreValidationDuringExecution: true,
					},
					{
						displayName: 'Value',
						name: 'booleanValue',
						type: 'options',
						default: 'true',
						options: [
							{
								name: 'True',
								value: 'true',
							},
							{
								name: 'False',
								value: 'false',
							},
						],
						displayOptions: {
							show: {
								type: ['booleanValue'],
							},
						},
						validateType: 'boolean',
						ignoreValidationDuringExecution: true,
					},
					{
						displayName: 'Value',
						name: 'arrayValue',
						type: 'string',
						default: '',
						placeholder: 'e.g. [ arrayItem1, arrayItem2, arrayItem3 ]',
						displayOptions: {
							show: {
								type: ['arrayValue'],
							},
						},
						validateType: 'array',
						ignoreValidationDuringExecution: true,
					},
					{
						displayName: 'Value',
						name: 'objectValue',
						type: 'json',
						default: '={}',
						typeOptions: {
							rows: 2,
						},
						displayOptions: {
							show: {
								type: ['objectValue'],
							},
						},
						validateType: 'object',
						ignoreValidationDuringExecution: true,
					},
				],
			},
		],
	},
	{
		displayName: 'Fields to Set',
		name: 'assignments',
		type: 'assignmentCollection',
		displayOptions: {},
		default: {},
	},
];

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions,
	item: INodeExecutionData,
	i: number,
	options: SetNodeOptions,
	node: INode,
) {
	try {
		const assignmentCollection = this.getNodeParameter(
			'assignments',
			i,
		) as AssignmentCollectionValue;
		const newData = Object.fromEntries(
			(assignmentCollection?.assignments ?? []).map((assignment) => {
				const { name, value } = validateEntry(
					assignment.name,
					assignment.type as FieldType,
					assignment.value,
					node,
					i,
					options.ignoreConversionErrors,
				);

				return [name, value];
			}),
		);
		return composeReturnItem.call(this, i, item, newData, options);
	} catch (error) {
		if (this.continueOnFail()) {
			return { json: { error: (error as Error).message, pairedItem: { item: i } } };
		}
		throw new NodeOperationError(this.getNode(), error as Error, {
			itemIndex: i,
			description: error.description,
		});
	}
}
