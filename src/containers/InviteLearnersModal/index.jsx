import { connect } from 'react-redux';

import InviteLearnersModal from '../../components/InviteLearnersModal';

import addLicensesForUsers from '../../data/actions/userSubscription';

const mapStateToProps = state => ({
  contactEmail: state.portalConfiguration.contactEmail,
});

const mapDispatchToProps = dispatch => ({
  addLicensesForUsers: (options, enterpriseUUID) => new Promise((resolve, reject) => {
    dispatch(addLicensesForUsers({
      options,
      enterpriseUUID,
      onSuccess: (response) => { resolve(response); },
      onError: (error) => { reject(error); },
    }));
  }),
});

export default connect(mapStateToProps, mapDispatchToProps)(InviteLearnersModal);
