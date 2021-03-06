import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import Card from '../card/Card';
import Notes from '../notes/Notes';
import { CARD_TYPES, STATUS_OPTIONS } from '../../constants/constants';
import { formatPhoneNumber, backURL, formatDateFromString } from '../../utils';

// mock data
import { dummyUser, tickets } from '../../data';

class TicketModal extends Component {
  constructor(props) {
    super(props);

    this.isUserPropertyManager = this.isUserPropertyManager.bind(this);
    this.toggleFlag = this.toggleFlag.bind(this);

    this.ticket = tickets.find(
      ({ id }) => id === this.props.match.params.ticket
    );

    this.user = dummyUser;

    this.state = {
      flagged: this.ticket ? Boolean(this.ticket.flagged) : false
    };
  }

  isUserPropertyManager() {
    return this.user.role && this.user.role.isPropertyManager === 'true';
  }

  toggleFlag() {
    this.setState(({ flagged }) => ({ flagged: !flagged }));
  }

  render() {
    const { history, match } = this.props;
    const {
      id,
      issue,
      tenant,
      sender,
      dateCreated,
      status,
      urgency,
      notes
    } = this.ticket;
    const sentDate = formatDateFromString(dateCreated);
    const backUrl = backURL(match.url);
    const ticketTypes = this.isUserPropertyManager()
      ? [CARD_TYPES.LARGE, CARD_TYPES.TICKET]
      : [CARD_TYPES.LARGE, CARD_TYPES.STATUS];

    const reopenButton = (
      <button type="button" className="btn btn--strong" onClick={() => {}}>
        Reopen
      </button>
    );

    const newNoteButton = (
      <button type="button" className="btn btn--strong" onClick={() => {}}>
        Add Note
      </button>
    );

    return (
      <div>
        {this.ticket && (
          <section key={id} className="modal">
            <button
              className="modal__bg"
              type="button"
              aria-label="Close Ticket"
              onClick={() => {
                history.push(backUrl);
              }}
            />
            <Card className="width-wrapper" types={ticketTypes} status={status}>
              <Card.Top>
                <Card.Header
                  label={issue}
                  close={() => {
                    history.push(backUrl);
                  }}
                  isFlagged={this.state.flagged}
                  toggleFlag={this.toggleFlag}
                />
                <Card.Content>
                  <div className="card__contact container">
                    {tenant && (
                      <div className="container--left">
                        <h4>Tenant</h4>
                        <p className="title">{tenant.name}</p>
                        <a href={formatPhoneNumber(tenant.phone)}>
                          {tenant.phone}
                        </a>
                      </div>
                    )}
                    {urgency && (
                      <div className="container--right">
                        <h4>Urgency</h4>
                        <p
                          className={`status status--${urgency.toLowerCase()}`}>
                          {urgency}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="card__contact container">
                    {sender && (
                      <div className="container--left">
                        <h4>Sender</h4>
                        <p className="title">{sender.name}</p>
                        <a href={formatPhoneNumber(sender.phone)}>
                          {sender.phone}
                        </a>
                      </div>
                    )}

                    <div className="container--right">
                      <h4>Sent</h4>
                      <time className="meta" dateTime={sentDate}>
                        {sentDate}
                      </time>
                    </div>
                  </div>
                </Card.Content>
              </Card.Top>
              <Card.Bottom>
                <Card.Content>
                  <Notes
                    action={
                      status === STATUS_OPTIONS.CLOSED
                        ? reopenButton
                        : newNoteButton
                    }
                    notes={notes}
                  />
                </Card.Content>
              </Card.Bottom>
            </Card>
          </section>
        )}
      </div>
    );
  }
}

TicketModal.propTypes = {
  history: PropTypes.shape({}).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      ticket: PropTypes.string
    })
  }).isRequired
};

export default withRouter(TicketModal);
