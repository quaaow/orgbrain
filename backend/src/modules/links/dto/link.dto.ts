import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import {
  LinkNodeType,
  LinkRelation,
} from '../../../entities/entity-link.entity';

export class CreateLinkDto {
  @IsEnum(LinkNodeType)
  source_type: LinkNodeType;

  @IsUUID()
  source_id: string;

  @IsEnum(LinkNodeType)
  target_type: LinkNodeType;

  @IsUUID()
  target_id: string;

  @IsEnum(LinkRelation)
  relation: LinkRelation;
}

export class ListLinksQueryDto {
  @IsOptional()
  @IsEnum(LinkNodeType)
  node_type?: LinkNodeType;

  @IsOptional()
  @IsUUID()
  node_id?: string;
}
