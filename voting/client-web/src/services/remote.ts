import axios from 'axios';

const remoteAddress = 'https://orbs-voting-proxy-server.herokuapp.com/api';

export class RemoteService {
  getGuardians(offset: number, limit: number) {
    return axios
      .get(`${remoteAddress}/guardians`, {
        params: { limit, offset }
      })
      .then(res => res.data);
  }
  getGuardianData(address: string) {
    return axios
      .get(`${remoteAddress}/guardians/${address}`)
      .then(res => res.data);
  }
  getValidators() {
    return axios.get(`${remoteAddress}/validators`).then(res => res.data);
  }
  getElectedValidators() {
    return axios
      .get(`${remoteAddress}/validators/elected`)
      .then(res => res.data);
  }
  getValidatorData(address: string) {
    return axios
      .get(`${remoteAddress}/validators/${address}`)
      .then(res => res.data);
  }
}
