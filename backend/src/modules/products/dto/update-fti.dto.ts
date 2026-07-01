import { PartialType } from '@nestjs/mapped-types'
import { CreateFTIDto } from './create-fti.dto'
import { OmitType } from '@nestjs/mapped-types'

export class UpdateFTIDto extends PartialType(OmitType(CreateFTIDto, ['product_id'] as const)) {}
