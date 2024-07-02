const Settings = require('@overleaf/settings')
const { User } = require('../../models/User')
const {
  callbackify,
  promisify,
} = require('@overleaf/promise-utils')


const AuthenticationManagerLdap = {
  splitFullName(fullName) {
    fullName = fullName.trim();
    let lastSpaceIndex = fullName.lastIndexOf(' ');
    let firstNames = fullName.substring(0, lastSpaceIndex).trim();
    let lastName = fullName.substring(lastSpaceIndex + 1).trim();
    return [firstNames, lastName];
  },
  async findOrCreateLdapUser(ldapUser, auditLog) {
    //user is already authenticated in Ldap
    const attEmail = Settings.ldap.attEmail
    const attFirstName = Settings.ldap?.attFirstName || ""
    const attLastName = Settings.ldap?.attLastName || ""
    const attName = Settings.ldap?.attName || ""

    let nameParts = ["",""]
    if ((!attFirstName || !attLastName) && attName) {
      nameParts = this.splitFullName(ldapUser[attName])
    }
    const firstName = attFirstName ? ldapUser[attFirstName] : nameParts[0]
    const lastName  = attLastName  ? ldapUser[attLastName]  : nameParts[1]
    const email = ldapUser[attEmail].toLowerCase()

    var user = await User.findOne({ 'email': email }).exec()
    if( !user ) {
      const UserCreator = require("../User/UserCreator")
      const isAdmin = ldapUser._groups.length > 0 ? true : false
      user = await UserCreator.promises.createNewUser(
        {
          email: email,
          first_name: firstName,
          last_name: lastName,
          isAdmin: isAdmin,
          holdingAccount: false,
        }
      )
      await User.updateOne(
        { _id: user._id },
        { $set : { 'emails.0.confirmedAt' : Date.now() } }
      ).exec() //email of ldap user is confirmed
    }
    const userDetails = Settings.ldap.updateUserDetailsOnLogin ? { first_name : firstName, last_name: lastName } : {}
    const result = await User.updateOne(
      { _id: user._id, loginEpoch: user.loginEpoch }, { $inc: { loginEpoch: 1 }, $set: userDetails },
      {}
    ).exec()

    if (result.modifiedCount !== 1) {
      throw new ParallelLoginError()
    }
    return user
  },
}

module.exports = {
  findOrCreateLdapUser: callbackify(AuthenticationManagerLdap.findOrCreateLdapUser),
  splitFullName: AuthenticationManagerLdap.splitFullName,
  promises: AuthenticationManagerLdap,
}
