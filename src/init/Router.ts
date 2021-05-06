import express from 'express';
import { RouterBase, router } from 'ts-api';
/**
 * A chess configuration storage and validator
 */
@router('/')
export class Router extends RouterBase {
  constructor(context:any) {
    super(context);
    require('../__routes')(this);
  }
}

