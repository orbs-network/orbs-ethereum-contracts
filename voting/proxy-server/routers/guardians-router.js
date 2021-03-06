/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const express = require('express');

const guardiansRouter = (guardiansApi) => {
  const router = express.Router();

  /**
   * @swagger
   *
   * /guardians:
   *  get:
   *    description: Returns the list of guardians
   *    tags:
   *      - Guardians
   *    parameters:
   *      - name: offset
   *        in: query
   *        description: The cursor of the page
   *        required: true
   *      - name: limit
   *        in: query
   *        description: The amount of guardians in the batch
   *        required: true
   *    responses:
   *      '200':
   *        description: The list of guardians
   */
  router.get('/guardians', async (req, res) => {
    try {
      const { offset, limit } = req.query;
      const guardians = await guardiansApi.getGuardiansList(offset, limit);
      res.json(guardians);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  /**
   * @swagger
   *
   * /guardians/{address}:
   *  get:
   *    description: Returns the information about particular guardian
   *    tags:
   *      - Guardians
   *    parameters:
   *      - name: address
   *        in: path
   *        description: Guardian ethereum address
   *        required: true
   *    responses:
   *      '200':
   *        description: The detailed information about the guardian with given address
   */
  router.get('/guardians/:address', async (req, res) => {
    try {
      const address = req.params['address'];
      const data = await guardiansApi.getGuardianInfo(address);
      res.json(data);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = guardiansRouter;
