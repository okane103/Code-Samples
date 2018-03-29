const responses = require('../models/responses')
const leadsService = require('../services/leads.service')
const activityService = require('../services/activities.service')
const validateActivity = require('../helpers/validate')
const activity = require('../models/activity')
const paypalService = require('../services/paypal.service')
const activityManager = require('../managers/activity.manager')
const mailService = require('../services/mail.service')

module.exports = {
    generate: _generate,
    updateNotes: _updateNotes,
    updateStatus: _updateStatus,
    readAll: _readAll,
    readAllExt: _readAllExt,
    readMetricsLeadByDate: _readMetricsLeadByDate,
    readById: _readById,
    update: _update,
    delete: _delete,
    readByUserId: _readByUserId,
    readByIdExt: _readByIdExt,
    getByProviderId: _getByProviderId,
    getPaidLeads: _getPaidLeads,
}

function _readMetricsLeadByDate(req, res) {
    leadsService.readMetricsLeadByDate()
        .then(data => {
            res.json(new responses.ItemResponse(data))
        })
        .catch(err => res.status(500).send(new responses.ErrorResponse(err)))
}

function _updateNotes(req, res) {
    leadsService.updateNotesInLeads(req.params.id, req.body, req.query)
        .then(() => {
            if (req.query['disable-notification'] === 'true') {
                const responseModel = new responses.SuccessResponse()
                res.status(200).json(responseModel)
            } else {
                leadsService.getUserByLeadId(req.params.id)
                    .then(user => {
                        mailService.sendNoteLeadStatusChange(user.userData.email, req.body.note)
                            .then(() => {
                                const responseModel = new responses.SuccessResponse()
                                res.status(200).json(responseModel)
                            })
                            .catch(err => {
                                res.status(500).send(new responses.ErrorResponse(err))
                            })
                    })
                    .catch(err => {
                        res.status(500).send(new responses.ErrorResponse(err))
                    })
            }

        })
        .catch(err => {
            res.status(500).send(new responses.ErrorResponse(err))
        })
}

function _updateStatus(req, res) {
    let doc = {
        activityType: "Lead Status Change",
        metadata: [
            { leadId: req.params.id },
            { priorStatus: null },
            { leadStatus: req.body.status },
            { userRole: null }
        ]
    }

    leadsService.updateStatus(req.params.id, req.body)
        .then(status => {
            activityManager.logActivity(doc)
            const response = new responses.SuccessResponse()
            res.status(200).send(responses)
        })
        .catch(err => {
            res.status(500).send(new responses.ErrorResponse(err))
        })
}

function _getByProviderId(req, res) {
    leadsService.getByProviderId(req.params.id, req.params.count)
        .then(lead => {
            res.json(new responses.ItemsResponse(lead))
        })
        .catch(err => res.status(500).send(new responses.ErrorResponse(err)))
}

function _readByUserId(req, res) {
    leadsService.readByUserId(req.params.id, req.params.count)
        .then(leads => {
            res.json(new responses.ItemsResponse(leads))
        })
        .catch(err => {
            res.status(500).send(new responses.ErrorResponse(err))
        })
}

function _generate(req, res) {
    let doc = {
        activityType: "Lead Status Change",
        metadata: [
            { leadId: null },
            { priorStatus: null },
            { leadStatus: "submitted" },
            { userRole: null }
        ]
    }

    leadsService.create(req.model)
        .then(lead => {
            doc.metadata[0].leadId = lead._id
            return activityManager.logActivity(doc)
        })
        .then(res.json(new responses.ItemResponse(doc.metadata[0].leadId)))
        .catch(err => {
            console.log(err)
            res.send(new responses.ErrorResponse('database failed to return insertedId'))
        })
}

function _readById(req, res) {
    leadsService.readById(req.params.id)
        .then(lead => {
            res.json(new responses.ItemResponse(lead[0]))
        })
        .catch(err => res.status(500).send(new responses.ErrorResponse(err)))
}

function _readAll(req, res) {
    const role = req.auth.userRole

    let id = ""
    if (role === 'Provider') {
        id = req.auth.providerId
    }
    else if (role === 'User') {
        id = req.auth.userId
    }

    const queryInfo = {
        role: role,
        id: id
    }

    leadsService.readAll(queryInfo)
        .then(leads => {
            res.json(new responses.ItemsResponse(leads))
        })
        .catch(err => {
            res.status(500).send(new responses.ErrorResponse(err))
        })
}

function _readAllExt(req, res) {
    leadsService.readAllExt(req.params.leadStatus)
        .then(leads => {
            res.json(new responses.ItemsResponse(leads))
        })
        .catch(err => {
            res.status(500).send(new responses.ErrorResponse(err))
        })
}

function _update(req, res) {
    leadsService.update(req.params.id, req.model)
        .then(lead => {
            res.status(200).json(new responses.ItemResponse(lead))
        })
        .catch(err => {
            console.log(err)
            res.status(500).send(new responses.ErrorResponse(err))
        })
}

function _delete(req, res) {
    leadsService.delete(req.params.id)
        .then(result => {
            if (result) {
                res.status(200).json(new responses.SuccessResponse())
            } else {
                res.status(500).send(new responses.ErrorResponse('item was not found'))
            }
        })
        .catch(err => {
            console.log(err)
            return res.status(500).send(new responses.ErrorResponse(err))
        })
}

function _readByIdExt(req, res) {
    leadsService.readByIdExt(req.params.id)
        .then(lead => {
            res.json(new responses.ItemResponse(lead))
        })
        .catch(err => res.status(500).send(new responses.ErrorResponse(err)))
}

function _getPaidLeads(req, res) {
    leadsService.getPaidLeads(req.query.min, req.query.max)
        .then(leads => {
            res.json(new responses.ItemsResponse(leads))
        })
        .catch(err => res.status(500).send(new responses.ErrorResponse(err)))
}