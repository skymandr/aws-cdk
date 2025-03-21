import { ArnFormat, Resource, Stack, IResource } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { IotSql } from './iot-sql';
import { CfnTopicRule } from './iot.generated';

/**
 * Represents an AWS IoT Rule
 */
export interface ITopicRule extends IResource {
  /**
   * The value of the topic rule Amazon Resource Name (ARN), such as
   * arn:aws:iot:us-east-2:123456789012:rule/rule_name
   *
   * @attribute
   */
  readonly topicRuleArn: string;

  /**
   * The name topic rule
   *
   * @attribute
   */
  readonly topicRuleName: string;
}

/**
 * Properties for defining an AWS IoT Rule
 */
export interface TopicRuleProps {
  /**
   * The name of the rule.
   * @default None
   */
  readonly topicRuleName?: string;

  /**
   * A simplified SQL syntax to filter messages received on an MQTT topic and push the data elsewhere.
   *
   * @see https://docs.aws.amazon.com/iot/latest/developerguide/iot-sql-reference.html
   */
  readonly sql: IotSql;
}

/**
 * Defines an AWS IoT Rule in this stack.
 */
export class TopicRule extends Resource implements ITopicRule {
  /**
   * Import an existing AWS IoT Rule provided an ARN
   *
   * @param scope The parent creating construct (usually `this`).
   * @param id The construct's name.
   * @param topicRuleArn AWS IoT Rule ARN (i.e. arn:aws:iot:<region>:<account-id>:rule/MyRule).
   */
  public static fromTopicRuleArn(scope: Construct, id: string, topicRuleArn: string): ITopicRule {
    const parts = Stack.of(scope).splitArn(topicRuleArn, ArnFormat.SLASH_RESOURCE_NAME);
    if (!parts.resourceName) {
      throw new Error(`Missing topic rule name in ARN: '${topicRuleArn}'`);
    }
    const resourceName = parts.resourceName;

    class Import extends Resource implements ITopicRule {
      public readonly topicRuleArn = topicRuleArn;
      public readonly topicRuleName = resourceName;
    }
    return new Import(scope, id, {
      environmentFromArn: topicRuleArn,
    });
  }

  /**
   * Arn of this rule
   * @attribute
   */
  public readonly topicRuleArn: string;

  /**
   * Name of this rule
   * @attribute
   */
  public readonly topicRuleName: string;

  constructor(scope: Construct, id: string, props: TopicRuleProps) {
    super(scope, id, {
      physicalName: props.topicRuleName,
    });

    const sqlConfig = props.sql.bind(this);

    const resource = new CfnTopicRule(this, 'Resource', {
      ruleName: this.physicalName,
      topicRulePayload: {
        actions: [],
        awsIotSqlVersion: sqlConfig.awsIotSqlVersion,
        sql: sqlConfig.sql,
      },
    });

    this.topicRuleArn = this.getResourceArnAttribute(resource.attrArn, {
      service: 'iot',
      resource: 'rule',
      resourceName: this.physicalName,
    });
    this.topicRuleName = this.getResourceNameAttribute(resource.ref);
  }
}
